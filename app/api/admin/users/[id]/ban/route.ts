// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isBanned } = body;

    // Prevent banning yourself
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot ban your own account" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isBanned },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: isBanned ? `BANNED_USER_${params.id}` : `UNBANNED_USER_${params.id}`,
        metadata: {
          targetUser: updatedUser.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user ban status:", error);
    return NextResponse.json(
      { error: "Failed to update user ban status" },
      { status: 500 }
    );
  }
}