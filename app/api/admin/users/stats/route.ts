// app/api/admin/users/stats/route.ts
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
      totalUsers,
      adminUsers,
      regularUsers,
      freeUsers,
      proUsers,
      teamUsers,
      activeUsers,
      bannedUsers,
      usersWithProjects,
      totalProjects,
      totalDownloads,
      totalApiKeys,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { plan: "FREE" } }),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({ where: { plan: "TEAM" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({
        where: {
          projects: {
            some: {},
          },
        },
      }),
      prisma.project.count(),
      prisma.downloadHistory.count(),
      prisma.apiKey.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      adminUsers,
      regularUsers,
      freeUsers,
      proUsers,
      teamUsers,
      activeUsers,
      bannedUsers,
      usersWithProjects,
      totalProjects,
      totalDownloads,
      totalApiKeys,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}