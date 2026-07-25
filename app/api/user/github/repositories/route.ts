// app/api/user/github/repositories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repositories = await prisma.githubRepository.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      repositoryName,
      repositoryUrl,
      cloneUrl,
      defaultBranch,
      private: isPrivate,
    } = body;

    if (!projectId || !repositoryName || !repositoryUrl || !cloneUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Cek apakah project milik user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada repository untuk project ini
    const existing = await prisma.githubRepository.findUnique({
      where: { projectId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Project already has a GitHub repository" },
        { status: 400 }
      );
    }

    const repository = await prisma.githubRepository.create({
      data: {
        userId: session.user.id,
        projectId,
        repositoryName,
        repositoryUrl,
        cloneUrl,
        defaultBranch: defaultBranch || "main",
        private: isPrivate !== undefined ? isPrivate : true,
      },
    });

    return NextResponse.json({ repository });
  } catch (error) {
    console.error("Error creating repository:", error);
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    );
  }
}