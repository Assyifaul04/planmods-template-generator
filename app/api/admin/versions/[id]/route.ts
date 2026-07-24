// app/api/admin/versions/[id]/route.ts
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

    const version = await prisma.minecraftVersion.findUnique({
      where: { id },
      include: {
        loaderVersions: {
          include: {
            templates: {
              select: {
                id: true,
                name: true,
                slug: true,
                platform: true,
                loader: true,
                enabled: true,
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
        },
        templates: {
          select: {
            id: true,
            name: true,
            slug: true,
            platform: true,
            loader: true,
            enabled: true,
            isFeatured: true,
          },
        },
        _count: {
          select: {
            projects: true,
            templates: true,
            loaderVersions: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { version, platform, isLatest, isSnapshot, releaseDate } = body;

    const existingVersion = await prisma.minecraftVersion.findUnique({
      where: { id },
    });

    if (!existingVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // If changing version, check uniqueness
    if (version && version !== existingVersion.version) {
      const versionExists = await prisma.minecraftVersion.findUnique({
        where: { version },
      });
      if (versionExists) {
        return NextResponse.json(
          { error: "Version already exists" },
          { status: 400 }
        );
      }
    }

    const updatedVersion = await prisma.minecraftVersion.update({
      where: { id },
      data: {
        version,
        platform,
        isLatest,
        isSnapshot,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        updatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_VERSION_${id}`,
        metadata: {
          version: updatedVersion.version,
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedVersion);
  } catch (error) {
    console.error("Error updating version:", error);
    return NextResponse.json(
      { error: "Failed to update version" },
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

    const existingVersion = await prisma.minecraftVersion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            templates: true,
            loaderVersions: true,
          },
        },
      },
    });

    if (!existingVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (existingVersion._count.projects > 0 || existingVersion._count.templates > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete version with associated projects or templates",
          projects: existingVersion._count.projects,
          templates: existingVersion._count.templates,
        },
        { status: 400 }
      );
    }

    await prisma.minecraftVersion.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETED_VERSION_${id}`,
        metadata: {
          version: existingVersion.version,
          platform: existingVersion.platform,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}