// app/api/user/generator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      templateId,
      name,
      description,
      platform,
      loader,
      minecraftVersion,
      packageName,
      modId,
      author,
      version,
      license,
      visibility,
    } = body;

    // Validate required fields
    if (!templateId || !name || !packageName || !modId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if user already has a project with this slug
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        slug,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "You already have a project with this name" },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        templateId,
        name,
        slug,
        description,
        platform: platform || template.platform,
        loader: loader || template.loader,
        minecraftVersion: minecraftVersion || template.minecraftVersion,
        packageName,
        modId,
        author: author || session.user.name || "Unknown",
        version: version || "1.0.0",
        license: license || "MIT",
        visibility: visibility || "PRIVATE",
        status: "GENERATING",
      },
    });

    // Update template usage count
    await prisma.template.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `CREATED_PROJECT_${project.id}`,
        metadata: {
          projectName: project.name,
          templateId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Simulate generation process (in production, this would trigger a background job)
    // For now, we'll mark it as READY after a short delay
    setTimeout(async () => {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: "READY",
        },
      });
    }, 5000);

    return NextResponse.json({
      success: true,
      project,
      message: "Project generation started",
    });
  } catch (error) {
    console.error("Error generating project:", error);
    return NextResponse.json(
      { error: "Failed to generate project" },
      { status: 500 }
    );
  }
}