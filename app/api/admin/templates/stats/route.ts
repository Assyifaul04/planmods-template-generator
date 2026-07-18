// app/api/admin/templates/stats/route.ts
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
      totalTemplates,
      featuredTemplates,
      enabledTemplates,
      platformCounts,
      loaderCounts,
      totalUsage,
      templatesByRepo,
    ] = await Promise.all([
      prisma.template.count(),
      prisma.template.count({ where: { isFeatured: true } }),
      prisma.template.count({ where: { enabled: true } }),
      prisma.template.groupBy({
        by: ["platform"],
        _count: true,
      }),
      prisma.template.groupBy({
        by: ["loader"],
        _count: true,
      }),
      prisma.template.aggregate({
        _sum: {
          usageCount: true,
        },
      }),
      prisma.template.groupBy({
        by: ["templateRepoId"],
        _count: true,
      }),
    ]);

    // Get template repo names
    const repoDetails = await Promise.all(
      templatesByRepo.map(async (item) => {
        if (item.templateRepoId) {
          const repo = await prisma.templateRepo.findUnique({
            where: { id: item.templateRepoId },
            select: { repoUrl: true, platform: true, loader: true },
          });
          return {
            repoId: item.templateRepoId,
            repoName: repo?.repoUrl?.split('/').pop() || item.templateRepoId,
            count: item._count,
          };
        }
        return {
          repoId: null,
          repoName: "No Repository",
          count: item._count,
        };
      })
    );

    return NextResponse.json({
      totalTemplates,
      featuredTemplates,
      enabledTemplates,
      platformCounts,
      loaderCounts,
      totalUsage: totalUsage._sum.usageCount || 0,
      templatesByRepo: repoDetails,
    });
  } catch (error) {
    console.error("Error fetching template stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch template statistics" },
      { status: 500 }
    );
  }
}