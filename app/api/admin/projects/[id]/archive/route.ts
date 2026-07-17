// app/api/admin/projects/[id]/archive/route.ts
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
    const { archived } = body;

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { 
        archivedAt: archived ? new Date() : null,
        status: archived ? "ARCHIVED" : "DRAFT",
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
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: archived ? `ARCHIVED_PROJECT_${params.id}` : `UNARCHIVED_PROJECT_${params.id}`,
        metadata: {
          projectName: updatedProject.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error archiving/unarchiving project:", error);
    return NextResponse.json(
      { error: "Failed to update project archive status" },
      { status: 500 }
    );
  }
}