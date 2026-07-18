// app/api/admin/projects/stats/route.ts
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
      totalProjects,
      statusCounts,
      visibilityCounts,
      platformCounts,
      loaderCounts,
      totalDownloads,
      totalStars,
      projectsWithGithub,
      projectsWithConfig,
      avgDownloads,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.project.groupBy({
        by: ["visibility"],
        _count: true,
      }),
      prisma.project.groupBy({
        by: ["platform"],
        _count: true,
      }),
      prisma.project.groupBy({
        by: ["loader"],
        _count: true,
      }),
      prisma.project.aggregate({
        _sum: {
          downloadsCount: true,
        },
      }),
      prisma.project.aggregate({
        _sum: {
          starsCount: true,
        },
      }),
      prisma.project.count({
        where: {
          githubRepository: {
            isNot: null,
          },
        },
      }),
      prisma.project.count({
        where: {
          config: {
            isNot: null,
          },
        },
      }),
      prisma.project.aggregate({
        _avg: {
          downloadsCount: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalProjects,
      statusCounts,
      visibilityCounts,
      platformCounts,
      loaderCounts,
      totalDownloads: totalDownloads._sum.downloadsCount || 0,
      totalStars: totalStars._sum.starsCount || 0,
      projectsWithGithub,
      projectsWithConfig,
      avgDownloads: avgDownloads._avg.downloadsCount || 0,
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch project statistics" },
      { status: 500 }
    );
  }
}