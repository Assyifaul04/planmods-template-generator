// app/api/user/projects/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import JSZip from "jszip";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        slug: true,
        userId: true,
        name: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Path to project directory
    const projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      session.user.id,
      project.slug
    );

    if (!fs.existsSync(projectDir)) {
      return NextResponse.json(
        { error: "Project files not found" },
        { status: 404 }
      );
    }

    // Create ZIP using JSZip
    const zip = new JSZip();

    // Function to recursively add files and folders
    function addFilesToZip(dir: string, zipFolder: JSZip) {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          // Create subfolder in zip
          const subFolder = zipFolder.folder(file.name);
          if (subFolder) {
            addFilesToZip(fullPath, subFolder);
          }
        } else {
          // Read file content
          const content = fs.readFileSync(fullPath);
          zipFolder.file(file.name, content);
        }
      }
    }

    // Add all files from project directory
    addFilesToZip(projectDir, zip);

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