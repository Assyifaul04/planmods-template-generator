// app/api/admin/projects/[id]/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch project config by project ID
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

    // First check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get project config
    const config = await prisma.projectConfig.findUnique({
      where: { projectId: id },
    });

    if (!config) {
      return NextResponse.json({
        id: null,
        projectId: id,
        loaderVersion: null,
        fabricApiVersion: null,
        loomVersion: null,
        javaVersion: null,
        gradleVersion: null,
        yarnVersion: null,
        mappingVersion: null,
        createdAt: null,
        updatedAt: null,
        message: "No configuration found for this project",
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching project config:", error);
    return NextResponse.json(
      { error: "Failed to fetch project config" },
      { status: 500 }
    );
  }
}

// POST - Create or update project config
export async function POST(
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

    const {
      loaderVersion,
      fabricApiVersion,
      loomVersion,
      javaVersion,
      gradleVersion,
      yarnVersion,
      mappingVersion,
    } = body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Upsert config
    const config = await prisma.projectConfig.upsert({
      where: { projectId: id },
      update: {
        loaderVersion: loaderVersion || null,
        fabricApiVersion: fabricApiVersion || null,
        loomVersion: loomVersion || null,
        javaVersion: javaVersion || null,
        gradleVersion: gradleVersion || null,
        yarnVersion: yarnVersion || null,
        mappingVersion: mappingVersion || null,
      },
      create: {
        projectId: id,
        loaderVersion: loaderVersion || null,
        fabricApiVersion: fabricApiVersion || null,
        loomVersion: loomVersion || null,
        javaVersion: javaVersion || null,
        gradleVersion: gradleVersion || null,
        yarnVersion: yarnVersion || null,
        mappingVersion: mappingVersion || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_PROJECT_CONFIG_${id}`,
        metadata: {
          projectId: id,
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      config,
      message: "Project configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating project config:", error);
    return NextResponse.json(
      { error: "Failed to update project config" },
      { status: 500 }
    );
  }
}

// DELETE - Delete project config
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

    // Check if config exists
    const config = await prisma.projectConfig.findUnique({
      where: { projectId: id },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    await prisma.projectConfig.delete({
      where: { projectId: id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DELETED_PROJECT_CONFIG_${id}`,
        metadata: {
          projectId: id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project config:", error);
    return NextResponse.json(
      { error: "Failed to delete project config" },
      { status: 500 }
    );
  }
}