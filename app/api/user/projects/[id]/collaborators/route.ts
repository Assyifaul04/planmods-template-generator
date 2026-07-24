// app/api/user/projects/[id]/collaborators/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List all collaborators for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { 
        userId: true,
        name: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    
    const isCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: id,
        userId: session.user.id,
      },
    });

    if (!isOwner && !isAdmin && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId: id },
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
      orderBy: { createdAt: "desc" },
    });

    const owner = await prisma.user.findUnique({
      where: { id: project.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const allCollaborators = [
      {
        id: `owner-${project.userId}`,
        role: "OWNER",
        createdAt: new Date().toISOString(),
        user: owner,
        isOwner: true,
      },
      ...collaborators.map(c => ({
        ...c,
        isOwner: false,
      })),
    ];

    return NextResponse.json({ 
      collaborators: allCollaborators,
      projectName: project.name,
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

// POST - Add collaborator to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role = "VIEWER" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { 
        userId: true,
        name: true,
        slug: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { 
        id: true, 
        name: true, 
        email: true,
        image: true,
      },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found with this email. Please make sure the user has registered on PlanMod." },
        { status: 404 }
      );
    }

    if (userToAdd.id === project.userId) {
      return NextResponse.json(
        { error: "Cannot add the project owner as collaborator" },
        { status: 400 }
      );
    }

    const existingCollaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 400 }
      );
    }

    // Add collaborator
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: role as "EDITOR" | "VIEWER",
        invitedBy: session.user.id,
      },
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
    });

    // ✅ NOTIFIKASI UNTUK USER YANG DIINVITE
    await prisma.notification.create({
      data: {
        userId: userToAdd.id,
        type: "SUCCESS",
        title: "🎉 You've been invited to collaborate!",
        message: `${session.user.name || "Someone"} has invited you to collaborate on "${project.name}" as ${role}. Click to view the project.`,
        link: `/user/projects/${id}`,
      },
    });

    // ✅ NOTIFIKASI UNTUK OWNER (konfirmasi)
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "INFO",
        title: "✅ Collaborator Added",
        message: `${userToAdd.name || userToAdd.email} has been added as ${role} to "${project.name}"`,
        link: `/user/projects/${id}`,
      },
    });

    // ✅ NOTIFIKASI UNTUK ADMIN (jika ada dan bukan admin yang melakukan)
    if (session.user.role !== "ADMIN") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "INFO",
            title: "📋 Collaborator Added by User",
            message: `${session.user.name || "A user"} added ${userToAdd.name || userToAdd.email} as ${role} to "${project.name}"`,
            link: `/user/projects/${id}`,
          },
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADD_COLLABORATOR",
        metadata: {
          projectId: id,
          projectName: project.name,
          collaboratorId: userToAdd.id,
          collaboratorEmail: userToAdd.email,
          collaboratorName: userToAdd.name,
          role: role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${userToAdd.name || email} added as ${role}`,
      collaborator,
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      { error: "Failed to add collaborator" },
      { status: 500 }
    );
  }
}

// DELETE - Remove collaborator from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const collaboratorId = searchParams.get("collaboratorId");

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collaboratorId) {
      return NextResponse.json(
        { error: "Collaborator ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { 
        userId: true,
        name: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaboratorToDelete = await prisma.projectCollaborator.findUnique({
      where: {
        id: collaboratorId,
        projectId: id,
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

    if (!collaboratorToDelete) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    await prisma.projectCollaborator.delete({
      where: {
        id: collaboratorId,
        projectId: id,
      },
    });

    // ✅ NOTIFIKASI UNTUK USER YANG DI-REMOVE
    await prisma.notification.create({
      data: {
        userId: collaboratorToDelete.user.id,
        type: "WARNING",
        title: "⚠️ Removed from Project",
        message: `You have been removed from "${project.name}" by ${session.user.name || "an admin"}`,
        link: `/user/projects`,
      },
    });

    // ✅ NOTIFIKASI UNTUK OWNER (konfirmasi)
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "INFO",
        title: "🗑️ Collaborator Removed",
        message: `${collaboratorToDelete.user.name || collaboratorToDelete.user.email} has been removed from "${project.name}"`,
        link: `/user/projects/${id}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REMOVE_COLLABORATOR",
        metadata: {
          projectId: id,
          projectName: project.name,
          collaboratorId: collaboratorToDelete.user.id,
          collaboratorEmail: collaboratorToDelete.user.email,
          collaboratorName: collaboratorToDelete.user.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Collaborator removed successfully`,
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      { error: "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}