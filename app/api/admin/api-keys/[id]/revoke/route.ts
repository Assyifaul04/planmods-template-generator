// app/api/admin/api-keys/[id]/revoke/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
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

    if (apiKey.revokedAt) {
      return NextResponse.json(
        { error: "API Key is already revoked" },
        { status: 400 }
      );
    }

    const revokedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: {
        revokedAt: new Date(),
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

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `REVOKED_API_KEY_${params.id}`,
        metadata: {
          keyName: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          userId: apiKey.userId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "API Key revoked successfully",
      apiKey: revokedKey,
    });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}