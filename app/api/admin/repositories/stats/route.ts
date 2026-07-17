// app/api/admin/repositories/stats/route.ts
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
      totalRepos,
      privateRepos,
      publicRepos,
      withWebhooks,
      withoutWebhooks,
      recentlySynced,
      needsSync,
    ] = await Promise.all([
      prisma.githubRepository.count(),
      prisma.githubRepository.count({ where: { private: true } }),
      prisma.githubRepository.count({ where: { private: false } }),
      prisma.githubRepository.count({ where: { webhookId: { not: null } } }),
      prisma.githubRepository.count({ where: { webhookId: null } }),
      prisma.githubRepository.count({
        where: {
          lastSyncedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.githubRepository.count({
        where: {
          OR: [
            { lastSyncedAt: null },
            {
              lastSyncedAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
              },
            },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      totalRepos,
      privateRepos,
      publicRepos,
      withWebhooks,
      withoutWebhooks,
      recentlySynced,
      needsSync,
    });
  } catch (error) {
    console.error("Error fetching repository stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository statistics" },
      { status: 500 }
    );
  }
}