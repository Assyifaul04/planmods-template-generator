// app/api/admin/api-keys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
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

    if (!apiKey) {
      return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETED_API_KEY_${params.id}`,
        metadata: {
          keyName: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          userId: apiKey.userId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}