// app/api/user/generator/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Octokit } from "@octokit/rest";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { download, list } from '@vercel/blob';
import JSZip from "jszip";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function downloadTemplateFromBlob(blobPath: string) {
  const { blobs } = await list({ prefix: blobPath });
  const files: Record<string, string> = {};
  
  for (const blob of blobs) {
    const response = await fetch(blob.url);
    const content = await response.text();
    const relativePath = blob.pathname.replace(`${blobPath}/`, '');
    files[relativePath] = content;
  }
  
  return files;
}

async function saveFilesToLocal(files: Record<string, string>, targetDir: string) {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  }
}

export async function POST(request: NextRequest) {
  let projectId: string = '';
  let projectDir: string = '';
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    projectId = body.projectId;
    const templateId = body.templateId;

    if (!projectId || !templateId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get project from database
    const project = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        slug: projectId,
      },
      include: {
        template: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Path to project files
    projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      session.user.id,
      project.slug
    );

    // Create project directory
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Download template from Vercel Blob
    const templatePath = `templates/${project.platform.toLowerCase()}/${project.loader.toLowerCase()}/${project.minecraftVersion}`;
    const templateFiles = await downloadTemplateFromBlob(templatePath);
    
    // Save template files to project directory
    await saveFilesToLocal(templateFiles, projectDir);

    // Get GitHub access token from session
    const githubToken = (session as any).githubAccessToken;
    if (!githubToken) {
      return NextResponse.json(
        { 
          error: "GitHub account not connected. Please connect your GitHub account first.",
          needGitHubAuth: true 
        },
        { status: 401 }
      );
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });

    // Get user info
    const userInfo = await octokit.users.getAuthenticated();
    const githubUsername = userInfo.data.login;

    // Check if repository already exists
    let repoExists = false;
    try {
      await octokit.repos.get({
        owner: githubUsername,
        repo: project.slug,
      });
      repoExists = true;
    } catch {
      repoExists = false;
    }

    let repoUrl: string;
    let cloneUrl: string;

    if (!repoExists) {
      // Create repository on GitHub
      const repo = await octokit.repos.createForAuthenticatedUser({
        name: project.slug,
        description: project.description || `Project ${project.name}`,
        private: project.visibility === 'PRIVATE',
        auto_init: true,
      });

      repoUrl = repo.data.html_url;
      cloneUrl = repo.data.clone_url;

      // Store GitHub repository info in database
      await prisma.githubRepository.create({
        data: {
          userId: session.user.id,
          projectId: project.id,
          repositoryName: repo.data.name,
          repositoryUrl: repo.data.html_url,
          cloneUrl: repo.data.clone_url,
          defaultBranch: 'main',
          private: repo.data.private,
          lastSyncedAt: new Date(),
        },
      });

      // Create README.md
      const readmePath = path.join(projectDir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        const readmeContent = `# ${project.name}

## Description
${project.description || `A Minecraft ${project.platform} mod project using ${project.loader}.`}

## Features
- Built with ${project.loader} for Minecraft ${project.minecraftVersion}
- Ready for development

## Getting Started

### Prerequisites
- Java 17 or higher
- Minecraft ${project.minecraftVersion}
- ${project.loader} loader

### Building
\`\`\`bash
./gradlew build
\`\`\`

### Running
\`\`\`bash
./gradlew runClient
\`\`\`

## License
This project is licensed under the ${project.license || 'MIT'} License.
`;
        fs.writeFileSync(readmePath, readmeContent);
      }

      // Create .gitignore if not exists
      const gitignorePath = path.join(projectDir, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const gitignoreContent = `# Compiled class files
*.class

# Log files
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files #
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# virtual machine crash logs
hs_err_pid*
`;
        fs.writeFileSync(gitignorePath, gitignoreContent);
      }

      // Push files to GitHub
      try {
        await execAsync(`cd "${projectDir}" && git init`);
        await execAsync(`cd "${projectDir}" && git config user.name "${session.user.name || 'User'}"`);
        await execAsync(`cd "${projectDir}" && git config user.email "${session.user.email || 'user@example.com'}"`);
        await execAsync(`cd "${projectDir}" && git add .`);
        await execAsync(`cd "${projectDir}" && git commit -m "Initial commit"`);
        await execAsync(`cd "${projectDir}" && git branch -M main`);
        await execAsync(`cd "${projectDir}" && git remote add origin ${cloneUrl}`);
        await execAsync(`cd "${projectDir}" && git push -u origin main`);
      } catch (gitError) {
        console.error("Git push error:", gitError);
        // Continue even if git push fails
      }

      // Prepare git commands for user
      const gitCommands = [
        `echo "# ${project.name}" >> README.md`,
        `git init`,
        `git add .`,
        `git commit -m "Initial commit"`,
        `git branch -M main`,
        `git remote add origin ${cloneUrl}`,
        `git push -u origin main`,
      ];

      return NextResponse.json({
        success: true,
        repositoryCreated: true,
        repoUrl: repoUrl,
        cloneUrl: cloneUrl,
        gitCommands: gitCommands,
        message: "Repository created successfully on GitHub!",
        downloadUrl: `/api/user/generator/download-zip?projectId=${projectId}`,
      });

    } else {
      // Repository already exists
      const repo = await octokit.repos.get({
        owner: githubUsername,
        repo: project.slug,
      });

      repoUrl = repo.data.html_url;
      cloneUrl = repo.data.clone_url;

      return NextResponse.json({
        success: true,
        repositoryCreated: false,
        repoUrl: repoUrl,
        cloneUrl: cloneUrl,
        message: "Repository already exists on GitHub",
        downloadUrl: `/api/user/generator/download-zip?projectId=${projectId}`,
      });
    }

  } catch (error: any) {
    console.error("Error in download process:", error);
    
    // If GitHub error, still allow download of ZIP
    if (error.status === 401 || error.message?.includes('Bad credentials')) {
      return NextResponse.json({
        success: false,
        needGitHubAuth: true,
        message: "GitHub authentication failed. Please reconnect your GitHub account.",
      }, { status: 401 });
    }
    
    // If error is Prisma validation or other errors, still provide download option
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to process download",
        downloadUrl: projectId ? `/api/user/generator/download-zip?projectId=${projectId}` : null,
        fallback: "You can download the project from the files section"
      },
      { status: 500 }
    );
  }
}