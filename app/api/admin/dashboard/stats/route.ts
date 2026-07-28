// app/api/admin/dashboard/stats/route.ts
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

    // Get date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel
    const [
      totalProjects,
      totalUsers,
      totalRepositories,
      totalDownloads,
      totalStars,
      activeProjects,
      newUsersThisMonth,
      newProjectsThisMonth,
      downloadsLastMonth,
      downloadsThisMonth,
      projectsWithRepos,
    ] = await Promise.all([
      // Total Projects
      prisma.project.count(),

      // Total Users
      prisma.user.count(),

      // Total Repositories
      prisma.githubRepository.count(),

      // Total Downloads
      prisma.downloadHistory.count(),

      // Total Stars
      prisma.projectStar.count(),

      // Active Projects (READY or GENERATING)
      prisma.project.count({
        where: {
          status: {
            in: ["READY", "GENERATING"],
          },
        },
      }),

      // New Users This Month
      prisma.user.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // New Projects This Month
      prisma.project.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Downloads Last Month
      prisma.downloadHistory.count({
        where: {
          downloadedAt: {
            gte: lastMonthFirstDay,
            lte: lastMonthLastDay,
          },
        },
      }),

      // Downloads This Month
      prisma.downloadHistory.count({
        where: {
          downloadedAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Projects with GitHub repositories
      prisma.project.count({
        where: {
          githubRepository: {
            isNot: null,
          },
        },
      }),
    ]);

    // Calculate growth rate
    const growthRate =
      downloadsLastMonth > 0
        ? Math.round(((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth) * 100)
        : downloadsThisMonth > 0
        ? 100
        : 0;

    // Get additional stats for charts
    const [projectStats, platformDistribution, loaderDistribution, recentActivity] =
      await Promise.all([
        // Project Status Distribution
        prisma.project.groupBy({
          by: ["status"],
          _count: {
            status: true,
          },
        }),

        // Platform Distribution
        prisma.project.groupBy({
          by: ["platform"],
          _count: {
            platform: true,
          },
        }),

        // Loader Distribution
        prisma.project.groupBy({
          by: ["loader"],
          _count: {
            loader: true,
          },
        }),

        // Recent Activity
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

    // Get private/public repos
    const [privateRepos, publicRepos] = await Promise.all([
      prisma.githubRepository.count({
        where: { private: true },
      }),
      prisma.githubRepository.count({
        where: { private: false },
      }),
    ]);

    // NOTE: daily downloads-by-platform data now lives in its own endpoint —
    // see /api/admin/dashboard/downloads-chart, used by <ChartAreaInteractive />.
    // Build activity (success/failed) lives in /api/admin/dashboard/builds-chart,
    // used by <ChartBarTooltip />. Keeping this route focused on summary counts
    // avoids two endpoints computing overlapping-but-different download series.

    // Format project stats
    const formattedProjectStats = projectStats.map((stat) => ({
      status: stat.status,
      count: stat._count.status,
    }));

    // Format platform distribution
    const formattedPlatformDistribution = platformDistribution.map((stat) => ({
      platform: stat.platform,
      count: stat._count.platform,
    }));

    // Format loader distribution
    const formattedLoaderDistribution = loaderDistribution.map((stat) => ({
      loader: stat.loader,
      count: stat._count.loader,
    }));

    return NextResponse.json({
      totalProjects,
      totalUsers,
      totalRepositories,
      totalDownloads,
      totalStars,
      activeProjects,
      privateRepos,
      publicRepos,
      newUsersThisMonth,
      newProjectsThisMonth,
      growthRate,
      projectsWithRepos,
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.action,
        createdAt: activity.createdAt,
        user: {
          name: activity.user.name,
          email: activity.user.email,
        },
      })),
      projectStats: formattedProjectStats,
      platformDistribution: formattedPlatformDistribution,
      loaderDistribution: formattedLoaderDistribution,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}