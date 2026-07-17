// app/api/admin/projects/[id]/visibility/route.ts
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
    const { visibility } = body;

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { 
        visibility,
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
        action: `UPDATED_PROJECT_VISIBILITY_${params.id}`,
        metadata: {
          projectName: updatedProject.name,
          newVisibility: visibility,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project visibility:", error);
    return NextResponse.json(
      { error: "Failed to update project visibility" },
      { status: 500 }
    );
  }
}