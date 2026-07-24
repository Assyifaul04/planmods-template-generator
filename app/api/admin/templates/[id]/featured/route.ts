// app/api/admin/templates/[id]/featured/route.ts
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
    const { isFeatured } = body;

    const template = await prisma.template.update({
      where: { id },
      data: { isFeatured },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_TEMPLATE_FEATURED_${id}`,
        metadata: {
          templateName: template.name,
          isFeatured,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating featured status:", error);
    return NextResponse.json(
      { error: "Failed to update featured status" },
      { status: 500 }
    );
  }
}