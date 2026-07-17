// app/api/admin/repositories/[id]/sync/route.ts
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

    const repository = await prisma.githubRepository.findUnique({
      where: { id: params.id },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Simulate sync process - in production, this would call GitHub API
    // and update the repository data
    const updatedRepository = await prisma.githubRepository.update({
      where: { id: params.id },
      data: {
        lastSyncedAt: new Date(),
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `SYNCED_REPOSITORY_${params.id}`,
        metadata: {
          repositoryName: repository.repositoryName,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Repository synced successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error("Error syncing repository:", error);
    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    );
  }
}