// app/api/admin/builds/[id]/retry/route.ts
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

    const build = await prisma.buildHistory.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    if (build.status !== "FAILED" && build.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only failed or cancelled builds can be retried" },
        { status: 400 }
      );
    }

    // Create a new build with the same project
    const newBuild = await prisma.buildHistory.create({
      data: {
        projectId: build.projectId,
        triggeredById: session.user.id,
        status: "PENDING",
        createdAt: new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        triggeredBy: {
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
        action: `RETRIED_BUILD_${params.id}`,
        metadata: {
          projectName: build.project.name,
          oldBuildId: build.id,
          newBuildId: newBuild.id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Build retry initiated",
      build: newBuild,
    });
  } catch (error) {
    console.error("Error retrying build:", error);
    return NextResponse.json(
      { error: "Failed to retry build" },
      { status: 500 }
    );
  }
}