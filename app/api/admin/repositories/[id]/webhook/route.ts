// app/api/admin/repositories/[id]/webhook/route.ts
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
    const { webhookId, webhookSecret } = body;

    const repository = await prisma.githubRepository.findUnique({
      where: { id: params.id },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const updatedRepository = await prisma.githubRepository.update({
      where: { id: params.id },
      data: {
        webhookId,
        webhookSecret,
        updatedAt: new Date(),
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
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_WEBHOOK_${params.id}`,
        metadata: {
          repositoryName: repository.repositoryName,
          hasWebhook: !!webhookId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedRepository);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}