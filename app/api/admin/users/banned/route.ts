// app/api/admin/users/banned/route.ts
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

    const [bannedUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: { isBanned: true },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          role: true,
          plan: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              downloads: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

    return NextResponse.json({
      users: bannedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching banned users:", error);
    return NextResponse.json(
      { error: "Failed to fetch banned users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, isBanned, reason } = body;

    if (!userId || isBanned === undefined) {
      return NextResponse.json(
        { error: "userId and isBanned are required" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot ban/unban your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: isBanned ? `BANNED_USER_${userId}` : `UNBANNED_USER_${userId}`,
        metadata: {
          reason: reason || "No reason provided",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user ban status:", error);
    return NextResponse.json(
      { error: "Failed to update user ban status" },
      { status: 500 }
    );
  }
}