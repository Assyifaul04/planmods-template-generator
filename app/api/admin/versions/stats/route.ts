// app/api/admin/versions/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalVersions,
      latestVersions,
      snapshots,
      javaVersions,
      bedrockVersions,
      totalLoaderVersions,
      totalTemplates,
      totalProjects,
    ] = await Promise.all([
      prisma.minecraftVersion.count(),
      prisma.minecraftVersion.count({ where: { isLatest: true } }),
      prisma.minecraftVersion.count({ where: { isSnapshot: true } }),
      prisma.minecraftVersion.count({ where: { platform: "JAVA" } }),
      prisma.minecraftVersion.count({ where: { platform: "BEDROCK" } }),
      prisma.loaderMinecraftVersion.count(),
      prisma.template.count(),
      prisma.project.count(),
    ]);

    const loaderDistribution = await prisma.loaderMinecraftVersion.groupBy({
      by: ["loader"],
      _count: true,
      orderBy: {
        _count: {
          loader: "desc",
        },
      },
    });

    return NextResponse.json({
      totalVersions,
      latestVersions,
      snapshots,
      javaVersions,
      bedrockVersions,
      totalLoaderVersions,
      totalTemplates,
      totalProjects,
      loaderDistribution,
    });
  } catch (error) {
    console.error("Error fetching version stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch version statistics" },
      { status: 500 }
    );
  }
}