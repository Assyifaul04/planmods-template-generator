// app/api/user/projects/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { list, download } from '@vercel/blob';

async function downloadTemplateFiles(blobPath: string) {
  const { blobs } = await list({ prefix: blobPath });
  const files: Record<string, Buffer> = {};
  
  for (const blob of blobs) {
    const response = await fetch(blob.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const relativePath = blob.pathname.replace(`${blobPath}/`, '');
    files[relativePath] = buffer;
  }
  
  return files;
}

function addFilesToZipFromLocal(dir: string, zipFolder: JSZip) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subFolder = zipFolder.folder(file.name);
      if (subFolder) {
        addFilesToZipFromLocal(fullPath, subFolder);
      }
    } else {
      try {
        let content: Buffer;
        let retries = 3;
        let lastError: Error | null = null;
        
        while (retries > 0) {
          try {
            content = fs.readFileSync(fullPath);
            zipFolder.file(file.name, content);
            break;
          } catch (readError: any) {
            lastError = readError;
            if (readError.code === 'EBUSY') {
              retries--;
              if (retries > 0) {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
              }
            } else {
              throw readError;
            }
          }
        }
        
        if (retries === 0 && lastError) {
          console.warn(`⚠️ Failed to read file after retries: ${file.name}`, lastError);
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        userId: true,
        name: true,
        platform: true,
        loader: true,
        minecraftVersion: true,
        description: true,
        license: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: id,
        userId: session.user.id,
      },
    });

    if (!isOwner && !isAdmin && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const zip = new JSZip();

    // Path to project directory
    const projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      project.userId,
      project.slug
    );

    // Check if project exists locally
    if (fs.existsSync(projectDir)) {
      // Add files from local directory
      addFilesToZipFromLocal(projectDir, zip);
    } else {
      // Download from blob
      const templatePath = `templates/${project.platform.toLowerCase()}/${project.loader.toLowerCase()}/${project.minecraftVersion}`;
      
      try {
        const templateFiles = await downloadTemplateFiles(templatePath);
        
        // Add template files to zip
        for (const [filePath, content] of Object.entries(templateFiles)) {
          zip.file(filePath, content);
        }
        
        // Add README
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
        zip.file('README.md', readmeContent);
        
        // Add .gitignore
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
        zip.file('.gitignore', gitignoreContent);
        
      } catch (error) {
        console.error("Error downloading from blob:", error);
        return NextResponse.json(
          { error: "Failed to download template files" },
          { status: 500 }
        );
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });

    // Return the ZIP file
    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading project:", error);
    return NextResponse.json(
      { error: "Failed to download project" },
      { status: 500 }
    );
  }
}