// app/api/admin/users/plans/route.ts
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

    // Get plan distribution
    const planStats = await prisma.user.groupBy({
      by: ["plan"],
      _count: true,
    });

    // Get additional plan-related stats with recent users
    const planUsers = await Promise.all(
      ["FREE", "PRO", "TEAM"].map(async (plan) => {
        const users = await prisma.user.findMany({
          where: { plan: plan as any },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            createdAt: true,
            _count: {
              select: {
                projects: true,
                downloads: true,
              },
            },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        });

        return {
          plan,
          count: users.length,
          recentUsers: users,
        };
      })
    );

    const totalUsers = await prisma.user.count();

    // Get counts from planStats
    const freeCount = planStats.find(p => p.plan === "FREE")?._count || 0;
    const proCount = planStats.find(p => p.plan === "PRO")?._count || 0;
    const teamCount = planStats.find(p => p.plan === "TEAM")?._count || 0;

    return NextResponse.json({
      planDistribution: planStats,
      planUsers,
      totalUsers,
      freeCount,
      proCount,
      teamCount,
    });
  } catch (error) {
    console.error("Error fetching plan statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan statistics" },
      { status: 500 }
    );
  }
}