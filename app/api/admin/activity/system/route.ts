// app/api/admin/activity/system/route.ts
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
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // System actions: admin actions, system events, etc.
    const systemActions = [
      "UPDATED_SYSTEM_SETTINGS",
      "UPDATED_SECURITY_SETTINGS",
      "UPDATED_MAINTENANCE_SETTINGS",
      "UPDATED_MAINTENANCE_SETTINGS_ENABLED",
      "UPDATED_MAINTENANCE_SETTINGS_DISABLED",
      "SYNCED_REPOSITORY",
      "UPDATED_WEBHOOK",
      "DELETED_REPOSITORY",
      "CREATED_TEMPLATE",
      "UPDATED_TEMPLATE",
      "DELETED_TEMPLATE",
      "UPDATED_TEMPLATE_FEATURED",
      "UPDATED_TEMPLATE_ENABLED",
      "CREATED_TAG",
      "UPDATED_TAG",
      "DELETED_TAG",
      "UPDATED_USER",
      "BANNED_USER",
      "UNBANNED_USER",
      "UPDATED_USER_ROLE",
      "DELETED_USER",
      "UPDATED_PROJECT",
      "DELETED_PROJECT",
      "UPDATED_PROJECT_STATUS",
      "UPDATED_PROJECT_VISIBILITY",
      "ARCHIVED_PROJECT",
      "UNARCHIVED_PROJECT",
      "CANCELLED_BUILD",
      "RETRIED_BUILD",
      "REVOKED_API_KEY",
      "RESTORED_API_KEY",
      "DELETED_API_KEY",
    ];

    const where: any = {
      action: { in: systemActions },
    };

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Get system action summary
    const systemActionSummary = await prisma.activityLog.groupBy({
      by: ["action"],
      _count: true,
      where: {
        action: { in: systemActions },
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
    });

    return NextResponse.json({
      activities,
      systemActionSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching system activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch system activities" },
      { status: 500 }
    );
  }
}