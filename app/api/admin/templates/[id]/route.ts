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
        templateRepo: {
          select: {
            id: true,
            repoUrl: true,
            branch: true,
            platform: true,
            loader: true,
            enabled: true,
          },
        },
        mcVersionData: {
          select: {
            id: true,
            version: true,
            platform: true,
            isLatest: true,
            isSnapshot: true,
            releaseDate: true,
          },
        },
        // FIXED: Changed from loaderMinecraftVersion to LoaderMinecraftVersion (capital L)
        LoaderMinecraftVersion: {
          select: {
            id: true,
            loader: true,
            loaderVersion: true,
            apiVersion: true,
            loomVersion: true,
            gradleVersion: true,
            javaVersion: true,
            mappingsVersion: true,
            recommended: true,
            supported: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            tags: true,
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
      templateRepoId,
      repoUrl,
      gradleUrl,
      enabled,
      isFeatured,
      loaderMinecraftVersionId,
      tagIds,
    } = body;

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
        templateRepoId: templateRepoId || null,
        repoUrl: repoUrl || null,
        gradleUrl: gradleUrl || null,
        enabled: enabled !== undefined ? enabled : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        loaderMinecraftVersionId: loaderMinecraftVersionId || null,
        updatedAt: new Date(),
      },
    });

    // Update tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.templateTag.deleteMany({
        where: { templateId: params.id },
      });

      await prisma.templateTag.createMany({
        data: tagIds.map((tagId: string) => ({
          templateId: params.id,
          tagId,
        })),
      });
    }

    const updatedTemplate = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        templateRepo: true,
        mcVersionData: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

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
  } catch (error: any) {
    console.error("Error updating template:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A template with this slug already exists." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    await prisma.template.delete({
      where: { id: params.id },
    });

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