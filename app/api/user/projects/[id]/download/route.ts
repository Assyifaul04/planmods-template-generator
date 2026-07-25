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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ PERBAIKAN 1: Await params
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
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

    // Path to project directory
    const projectDir = path.join(
      process.cwd(),
      "public",
      "projects",
      project.userId,
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

    // ✅ PERBAIKAN 2: Gunakan readFileSync dengan try-catch untuk menangani EBUSY
    function addFilesToZip(dir: string, zipFolder: JSZip) {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          const subFolder = zipFolder.folder(file.name);
          if (subFolder) {
            addFilesToZip(fullPath, subFolder);
          }
        } else {
          try {
            // ✅ PERBAIKAN 3: Baca file dengan flag dan retry jika EBUSY
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
                  // Tunggu sebentar lalu retry
                  retries--;
                  if (retries > 0) {
                    // Sleep 100ms
                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
                  }
                } else {
                  throw readError;
                }
              }
            }
            
            if (retries === 0 && lastError) {
              console.warn(`⚠️ Failed to read file after retries: ${file.name}`, lastError);
              // Skip file jika masih error
            }
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            // Skip file yang error dan lanjutkan
          }
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