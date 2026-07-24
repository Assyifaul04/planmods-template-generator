// app/api/user/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah user adalah owner atau collaborator
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        mcVersionData: {
          select: {
            version: true,
            platform: true,
          },
        },
        githubRepository: {
          select: {
            id: true,
            repositoryName: true,
            repositoryUrl: true,
            cloneUrl: true,
            defaultBranch: true,
            private: true,
            lastSyncedAt: true,
          },
        },
        downloads: {
          take: 10,
          orderBy: { downloadedAt: "desc" },
        },
        builds: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        stars: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            downloads: true,
            stars: true,
            builds: true,
            collaborators: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // ✅ Cek apakah user adalah owner atau collaborator
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    
    // Cek apakah user adalah collaborator
    const isCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: id,
        userId: session.user.id,
      },
    });

    // ✅ Jika bukan owner, admin, atau collaborator → Forbidden
    if (!isOwner && !isAdmin && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing project
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { 
        userId: true, 
        slug: true,
        name: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // ✅ Hanya owner atau admin yang bisa edit
    const isOwner = existingProject.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    // Generate new slug from new name
    const newSlug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-");
    const oldSlug = existingProject.slug;

    // Prepare update data
    const updateData: any = {
      name: body.name,
      description: body.description || null,
      platform: body.platform,
      loader: body.loader,
      minecraftVersion: body.minecraftVersion,
      packageName: body.packageName,
      modId: body.modId,
      author: body.author,
      version: body.version,
      license: body.license || "MIT",
      visibility: body.visibility,
      status: body.status,
      slug: newSlug,
    };

    // Update project di database
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        mcVersionData: {
          select: {
            version: true,
            platform: true,
          },
        },
        githubRepository: {
          select: {
            id: true,
            repositoryName: true,
            repositoryUrl: true,
            cloneUrl: true,
            defaultBranch: true,
            private: true,
            lastSyncedAt: true,
          },
        },
        _count: {
          select: {
            downloads: true,
            stars: true,
            builds: true,
            collaborators: true,
          },
        },
      },
    });

    // Rename folder if slug changed
    if (oldSlug !== newSlug) {
      try {
        const basePath = path.join(
          process.cwd(),
          "public",
          "projects",
          session.user.id
        );
        
        const oldPath = path.join(basePath, oldSlug);
        const newPath = path.join(basePath, newSlug);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Renamed project folder: ${oldSlug} → ${newSlug}`);
        } else {
          console.log(`⚠️ Project folder not found: ${oldPath}`);
        }
      } catch (fsError) {
        console.error("Error renaming project folder:", fsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { 
        userId: true,
        slug: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // ✅ Hanya owner atau admin yang bisa delete
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id },
    });

    // Hapus folder project dari filesystem
    try {
      const projectDir = path.join(
        process.cwd(),
        "public",
        "projects",
        session.user.id,
        project.slug
      );

      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
        console.log(`✅ Deleted project folder: ${projectDir}`);
      } else {
        console.log(`⚠️ Project folder not found: ${projectDir}`);
      }
    } catch (fsError) {
      console.error("Error deleting project files:", fsError);
    }

    return NextResponse.json({ 
      success: true,
      message: "Project deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}