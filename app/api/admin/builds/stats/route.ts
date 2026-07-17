// app/api/admin/builds/stats/route.ts
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
      totalBuilds,
      statusCounts,
      platformCounts,
      avgDuration,
      successRate,
      buildsLast7Days,
      buildsLast30Days,
    ] = await Promise.all([
      prisma.buildHistory.count(),
      prisma.buildHistory.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.buildHistory.groupBy({
        by: ["project", "platform"],
        _count: true,
      }),
      prisma.buildHistory.aggregate({
        _avg: {
          durationMs: true,
        },
        where: {
          status: "SUCCESS",
          durationMs: { not: null },
        },
      }),
      prisma.buildHistory.aggregate({
        _count: true,
        where: { status: "SUCCESS" },
      }),
      prisma.buildHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.buildHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const totalCount = await prisma.buildHistory.count();
    const successCount = await prisma.buildHistory.count({ where: { status: "SUCCESS" } });

    return NextResponse.json({
      totalBuilds,
      statusCounts,
      platformCounts,
      avgDurationMs: avgDuration._avg.durationMs || 0,
      successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
      buildsLast7Days,
      buildsLast30Days,
    });
  } catch (error) {
    console.error("Error fetching build statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch build statistics" },
      { status: 500 }
    );
  }
}