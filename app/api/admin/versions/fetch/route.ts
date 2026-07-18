// app/api/admin/versions/fetch/route.ts
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
    const { limit = 50, platform = "JAVA" } = body;

    // Fetch from Mojang
    const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    
    if (!manifestResponse.ok) {
      throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
    }
    
    const manifest = await manifestResponse.json();
    const latestRelease = manifest.latest.release;
    const latestSnapshot = manifest.latest.snapshot;
    
    // Process versions
    const versionsToProcess = manifest.versions.slice(0, limit);
    let created = 0;
    let skipped = 0;
    
    for (const version of versionsToProcess) {
      // Check if version exists
      const existing = await prisma.minecraftVersion.findUnique({
        where: { version: version.id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const isLatest = version.id === latestRelease;
      const isSnapshot = version.type === 'snapshot';
      
      // Create version
      const createdVersion = await prisma.minecraftVersion.create({
        data: {
          version: version.id,
          platform,
          isLatest,
          isSnapshot,
          releaseDate: new Date(version.releaseTime),
        },
      });
      
      // Create loaders for this version
      const loaders = [
        { loader: 'FABRIC', version: '0.15.11', recommended: isLatest },
        { loader: 'FORGE', version: '47.2.0', recommended: false },
        { loader: 'NEOFORGE', version: '20.4.100-beta', recommended: false },
        { loader: 'PAPER', version: '1.20.4-R0.1-SNAPSHOT', recommended: false },
      ];
      
      for (const loader of loaders) {
        if (loader.loader === 'FABRIC' && isSnapshot) continue;
        
        await prisma.loaderMinecraftVersion.create({
          data: {
            loader: loader.loader,
            minecraftVersionId: createdVersion.id,
            loaderVersion: loader.version,
            gradleVersion: '8.5',
            javaVersion: '17',
            recommended: loader.recommended,
            supported: true,
          },
        });
      }
      
      created++;
    }
    
    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: versionsToProcess.length,
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}