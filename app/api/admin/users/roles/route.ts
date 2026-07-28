// app/api/admin/users/roles/route.ts
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

    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    const usersByRole = await Promise.all(
      roles.map(async (role) => {
        const users = await prisma.user.findMany({
          where: { role: role.role },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            isBanned: true,
            createdAt: true,
          },
          take: 10,
        });
        return {
          role: role.role,
          count: role._count.role,
          users,
        };
      })
    );

    return NextResponse.json(usersByRole);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_USER_ROLE_${userId}`,
        metadata: {
          newRole: role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}