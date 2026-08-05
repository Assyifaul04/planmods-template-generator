// app/api/user/generator/download-zip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project from database
    const project = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        slug: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Try to get from local filesystem first
    const projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      session.user.id,
      project.slug
    );

    const zip = new JSZip();

    // Check if project exists locally
    if (fs.existsSync(projectDir)) {
      // Add local files to zip
      function addFilesToZip(dir: string, zipFolder: JSZip) {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
          if (file.name === '.git') continue;
          
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            const subFolder = zipFolder.folder(file.name);
            if (subFolder) {
              addFilesToZip(fullPath, subFolder);
            }
          } else {
            const content = fs.readFileSync(fullPath);
            zipFolder.file(file.name, content);
          }
        }
      }

      addFilesToZip(projectDir, zip);
    } else {
      // If not local, download from blob
      const templatePath = `templates/${project.platform.toLowerCase()}/${project.loader.toLowerCase()}/${project.minecraftVersion}`;
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
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading ZIP:", error);
    return NextResponse.json(
      { error: "Failed to download project" },
      { status: 500 }
    );
  }
}