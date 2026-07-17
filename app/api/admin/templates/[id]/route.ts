// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// app/api/admin/templates/[id]/route.ts (add PATCH)
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
    const {
      name,
      slug,
      description,
      thumbnailUrl,
      platform,
      loader,
      minecraftVersion,
      path,
      enabled,
      isFeatured,
      tagIds,
    } = body;

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if slug is unique (if changed)
    if (slug && slug !== existingTemplate.slug) {
      const slugExists = await prisma.template.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Template with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update template
    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        thumbnailUrl,
        platform,
        loader,
        minecraftVersion,
        path,
        enabled,
        isFeatured,
        updatedAt: new Date(),
      },
    });

    // Update tags if provided
    if (tagIds) {
      // Remove existing tags
      await prisma.templateTag.deleteMany({
        where: { templateId: params.id },
      });

      // Add new tags
      await prisma.templateTag.createMany({
        data: tagIds.map((tagId: string) => ({
          templateId: params.id,
          tagId,
        })),
      });
    }

    // Fetch updated template with tags
    const updatedTemplate = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_TEMPLATE_${params.id}`,
        metadata: {
          templateName: template.name,
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// app/api/admin/templates/[id]/route.ts (add DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete template
    await prisma.template.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETED_TEMPLATE_${params.id}`,
        metadata: {
          templateName: existingTemplate.name,
          projectCount: existingTemplate._count.projects,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}