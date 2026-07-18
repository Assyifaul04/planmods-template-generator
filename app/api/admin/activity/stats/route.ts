// app/api/admin/activity/stats/route.ts
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
      totalActivities,
      activitiesLast24h,
      activitiesLast7Days,
      activitiesLast30Days,
      uniqueUsers,
      actionCounts,
    ] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.activityLog.groupBy({
        by: ["userId"],
        _count: true,
      }),
      prisma.activityLog.groupBy({
        by: ["action"],
        _count: true,
        orderBy: {
          _count: {
            action: "desc",
          },
        },
        take: 10,
      }),
    ]);

    // Get user details for unique users
    const userDetails = await Promise.all(
      uniqueUsers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        return {
          userId: item.userId,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
          count: item._count,
        };
      })
    );

    // Get activities by hour for the last 24 hours
    const hourlyActivities = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "createdAt") as hour,
        COUNT(*) as count
      FROM "activity_logs"
      WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', "createdAt")
      ORDER BY hour ASC
    `;

    return NextResponse.json({
      totalActivities,
      activitiesLast24h,
      activitiesLast7Days,
      activitiesLast30Days,
      uniqueUsers: userDetails,
      topActions: actionCounts,
      hourlyActivities,
    });
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity statistics" },
      { status: 500 }
    );
  }
}