// app/api/user/generator/download-zip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

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

    // Gunakan findFirst karena userId + slug bukan unique constraint tunggal
    const project = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        slug: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

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

    const zip = new JSZip();

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