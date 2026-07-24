// app/api/admin/templates/create-fabric/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { createFabricTemplateStructure, getFabricTemplateFiles } from "@/lib/templates/fabric";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      templateName, 
      minecraftVersion, 
      loaderVersion,
      platform,
      loader 
    } = body;

    if (!templateName || !minecraftVersion) {
      return NextResponse.json(
        { error: "Missing required fields: templateName, minecraftVersion" },
        { status: 400 }
      );
    }

    const platformLower = (platform || "java").toLowerCase();
    const loaderLower = (loader || "fabric").toLowerCase();
    
    const outputPath = path.join(
      process.cwd(),
      "public/templates",
      platformLower,
      loaderLower,
      minecraftVersion
    );

    // Hapus folder jika sudah ada
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }

    // Buat template menggunakan template-builder
    const createdFiles = createFabricTemplateStructure({
      templateName,
      minecraftVersion,
      loaderVersion: loaderVersion || "0.16.9",
      outputPath,
    });

    // Dapatkan daftar file yang seharusnya ada
    const expectedFiles = getFabricTemplateFiles();

    return NextResponse.json({
      success: true,
      path: `public/templates/${platformLower}/${loaderLower}/${minecraftVersion}`,
      message: "Fabric template created successfully",
      files: createdFiles,
      expectedFiles,
    });
  } catch (error) {
    console.error("Error creating Fabric template:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    );
  }
}