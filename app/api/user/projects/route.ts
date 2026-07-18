// app/api/user/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const visibility = searchParams.get("visibility");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search") || "";

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    if (platform) {
      where.platform = platform;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        platform: true,
        loader: true,
        minecraftVersion: true,
        status: true,
        visibility: true,
        starsCount: true,
        downloadsCount: true,
        createdAt: true,
        updatedAt: true,
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            builds: true,
            downloads: true,
            stars: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// app/api/user/projects/route.ts (add POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      name,
      slug,
      description,
      platform,
      loader,
      minecraftVersion,
      packageName,
      modId,
      author,
      templateId,
      visibility,
    } = body;

    // Check if user already has a project with this slug
    const existingProject = await prisma.project.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "You already have a project with this slug" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        platform,
        loader,
        minecraftVersion,
        packageName: packageName || `com.example.${slug}`,
        modId: modId || slug,
        author: author || session.user.name || "Unknown",
        userId,
        templateId: templateId || null,
        visibility: visibility || "PRIVATE",
        status: "DRAFT",
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: `CREATED_PROJECT_${project.id}`,
        metadata: {
          projectName: project.name,
          projectId: project.id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

