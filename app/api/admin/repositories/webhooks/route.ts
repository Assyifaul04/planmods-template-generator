// app/api/admin/repositories/webhooks/route.ts
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
    const status = searchParams.get("status"); // "active", "inactive"

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "active") {
      where.webhookId = { not: null };
    } else if (status === "inactive") {
      where.webhookId = null;
    }

    const [repositories, total] = await Promise.all([
      prisma.githubRepository.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              visibility: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.githubRepository.count({ where }),
    ]);

    return NextResponse.json({
      webhooks: repositories.map((repo) => ({
        id: repo.id,
        repositoryName: repo.repositoryName,
        repositoryUrl: repo.repositoryUrl,
        webhookId: repo.webhookId,
        webhookSecret: repo.webhookSecret,
        project: repo.project,
        user: repo.user,
        isActive: !!repo.webhookId,
        lastSyncedAt: repo.lastSyncedAt,
        createdAt: repo.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}