// app/api/admin/builds/[id]/cancel/route.ts
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

    if (build.status !== "PENDING" && build.status !== "QUEUED" && build.status !== "RUNNING") {
      return NextResponse.json(
        { error: "Cannot cancel build that is not in progress" },
        { status: 400 }
      );
    }

    const cancelledBuild = await prisma.buildHistory.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        finishedAt: new Date(),
        errorMessage: "Cancelled by admin",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `CANCELLED_BUILD_${params.id}`,
        metadata: {
          projectName: build.project.name,
          buildId: build.id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Build cancelled successfully",
      build: cancelledBuild,
    });
  } catch (error) {
    console.error("Error cancelling build:", error);
    return NextResponse.json(
      { error: "Failed to cancel build" },
      { status: 500 }
    );
  }
}