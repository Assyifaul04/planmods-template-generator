// app/api/admin/versions/loaders/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { minecraftVersion, loaders } = body;

    if (!minecraftVersion || !loaders || !Array.isArray(loaders)) {
      return NextResponse.json(
        { error: "Missing required fields: minecraftVersion and loaders array" },
        { status: 400 }
      );
    }

    // Find the Minecraft version
    const version = await prisma.minecraftVersion.findUnique({
      where: { version: minecraftVersion },
    });

    if (!version) {
      return NextResponse.json(
        { error: `Minecraft version "${minecraftVersion}" not found. Please add the version first.` },
        { status: 404 }
      );
    }

    const created = [];
    const skipped = [];

    for (const loader of loaders) {
      if (!loader.loader) {
        skipped.push({ loader: loader.loader || 'unknown', reason: 'Missing loader name' });
        continue;
      }

      // Check if loader already exists
      const existing = await prisma.loaderMinecraftVersion.findFirst({
        where: {
          loader: loader.loader,
          minecraftVersionId: version.id,
        },
      });

      if (existing) {
        skipped.push({ loader: loader.loader, reason: 'Already exists' });
        continue;
      }

      try {
        const createdLoader = await prisma.loaderMinecraftVersion.create({
          data: {
            loader: loader.loader,
            minecraftVersionId: version.id,
            loaderVersion: loader.loaderVersion || 'latest',
            apiVersion: loader.apiVersion || null,
            loomVersion: loader.loomVersion || null,
            gradleVersion: loader.gradleVersion || '8.5',
            javaVersion: loader.javaVersion || '17',
            recommended: loader.recommended || false,
            supported: loader.supported !== undefined ? loader.supported : true,
          },
        });
        created.push(createdLoader);
      } catch (error) {
        console.error(`Error creating loader ${loader.loader}:`, error);
        skipped.push({ loader: loader.loader, reason: 'Error creating' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${created.length} loader mappings for ${minecraftVersion}`,
      created: created.map(l => ({ id: l.id, loader: l.loader, version: l.loaderVersion })),
      skipped,
    });
  } catch (error) {
    console.error("Error adding loader mappings:", error);
    return NextResponse.json(
      { error: "Failed to add loader mappings" },
      { status: 500 }
    );
  }
}