// app/api/admin/repositories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const repository = await prisma.githubRepository.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            githubUsername: true,
          },
        },
        project: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                downloads: true,
                stars: true,
                builds: true,
              },
            },
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json(repository);
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const repository = await prisma.githubRepository.findUnique({
      where: { id },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    await prisma.githubRepository.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETED_REPOSITORY_${id}`,
        metadata: {
          repositoryName: repository.repositoryName,
          projectId: repository.projectId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    );
  }
}