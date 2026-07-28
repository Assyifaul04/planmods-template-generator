// app/api/admin/repositories/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");

    const [
      totalRepos,
      privateRepos,
      publicRepos,
      withWebhooks,
      withoutWebhooks,
      recentlySynced,
      needsSync,
      totalProjects,
      withGithub,
      withoutGithub,
    ] = await Promise.all([
      prisma.githubRepository.count(),
      prisma.githubRepository.count({ where: { private: true } }),
      prisma.githubRepository.count({ where: { private: false } }),
      prisma.githubRepository.count({ where: { webhookId: { not: null } } }),
      prisma.githubRepository.count({ where: { webhookId: null } }),
      prisma.githubRepository.count({
        where: {
          lastSyncedAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.githubRepository.count({
        where: {
          OR: [
            { lastSyncedAt: null },
            {
              lastSyncedAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      }),
      prisma.project.count(),
      prisma.project.count({
        where: {
          githubRepository: { isNot: null },
        },
      }),
      prisma.project.count({
        where: {
          githubRepository: { is: null },
        },
      }),
    ]);

    // Top repositories by project count (per user)
    const topUsers = await prisma.user.findMany({
      where: {
        repositories: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            repositories: true,
          },
        },
      },
      orderBy: {
        repositories: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        action: {
          contains: 'REPOSITORY',
        },
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      total: {
        repositories: totalRepos,
        private: privateRepos,
        public: publicRepos,
        withWebhooks,
        withoutWebhooks,
        recentlySynced,
        needsSync,
        projects: totalProjects,
        withGithub,
        withoutGithub,
      },
      topUsers: topUsers.map((u) => ({
        ...u,
        repositoryCount: u._count.repositories,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching repository stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository statistics" },
      { status: 500 }
    );
  }
}