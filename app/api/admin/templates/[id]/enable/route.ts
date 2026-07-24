// app/api/admin/templates/[id]/enable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    const template = await prisma.template.update({
      where: { id },
      data: { enabled },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_TEMPLATE_ENABLED_${id}`,
        metadata: {
          templateName: template.name,
          enabled,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating enabled status:", error);
    return NextResponse.json(
      { error: "Failed to update enabled status" },
      { status: 500 }
    );
  }
}