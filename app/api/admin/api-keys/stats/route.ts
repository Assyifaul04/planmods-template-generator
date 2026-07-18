// app/api/admin/api-keys/stats/route.ts
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
      totalKeys,
      activeKeys,
      revokedKeys,
      keysByUser,
      keysUsedLast7Days,
      keysUsedLast30Days,
      expiredKeys,
    ] = await Promise.all([
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { revokedAt: null } }),
      prisma.apiKey.count({ where: { revokedAt: { not: null } } }),
      prisma.apiKey.groupBy({
        by: ["userId"],
        _count: true,
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 10,
      }),
      prisma.apiKey.count({
        where: {
          lastUsedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          revokedAt: null,
        },
      }),
      prisma.apiKey.count({
        where: {
          lastUsedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          revokedAt: null,
        },
      }),
      prisma.apiKey.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          revokedAt: null,
        },
      }),
    ]);

    // Get user details for keysByUser
    const userKeys = await Promise.all(
      keysByUser.map(async (item) => {
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

    return NextResponse.json({
      totalKeys,
      activeKeys,
      revokedKeys,
      keysByUser: userKeys,
      keysUsedLast7Days,
      keysUsedLast30Days,
      expiredKeys,
    });
  } catch (error) {
    console.error("Error fetching API key statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch API key statistics" },
      { status: 500 }
    );
  }
}