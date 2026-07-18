// app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        platform: true,
        loader: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get user's recent downloads
    const downloads = await prisma.downloadHistory.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { downloadedAt: "desc" },
      take: 5,
    });

    // Get user's recent notifications
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get stats
    const [
      totalProjects,
      totalDownloads,
      totalStars,
      totalBuilds,
      totalNotifications,
      draftProjects,
      readyProjects,
      failedProjects,
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.downloadHistory.count({ where: { userId } }),
      prisma.projectStar.count({ where: { userId } }),
      prisma.buildHistory.count({
        where: { project: { userId } },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.project.count({ where: { userId, status: "DRAFT" } }),
      prisma.project.count({ where: { userId, status: "READY" } }),
      prisma.project.count({ where: { userId, status: "FAILED" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalProjects,
        totalDownloads,
        totalStars,
        totalBuilds,
        totalNotifications,
        draftProjects,
        readyProjects,
        failedProjects,
      },
      recentProjects: projects,
      recentDownloads: downloads,
      recentNotifications: notifications,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}