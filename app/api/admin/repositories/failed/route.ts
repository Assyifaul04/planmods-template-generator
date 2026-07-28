// app/api/admin/repositories/failed/route.ts
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Get repositories that have never been synced or haven't synced in a while
    const failedRepos = await prisma.githubRepository.findMany({
      where: {
        OR: [
          { lastSyncedAt: null },
          {
            lastSyncedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.githubRepository.count({
      where: {
        OR: [
          { lastSyncedAt: null },
          {
            lastSyncedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    return NextResponse.json({
      repositories: failedRepos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching failed repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch failed repositories" },
      { status: 500 }
    );
  }
}