// app/api/user/github/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId } = body;

    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    const repository = await prisma.githubRepository.findUnique({
      where: { id: repositoryId },
      include: {
        project: true,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update lastSyncedAt
    const updated = await prisma.githubRepository.update({
      where: { id: repositoryId },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      repository: updated,
      message: "Repository synced successfully",
    });
  } catch (error) {
    console.error("Error syncing repository:", error);
    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    );
  }
}