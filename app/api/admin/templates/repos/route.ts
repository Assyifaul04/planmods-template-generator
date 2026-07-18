// app/api/admin/templates/repos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { repoUrl: { contains: search, mode: "insensitive" } },
        { platform: { contains: search, mode: "insensitive" } },
        { loader: { contains: search, mode: "insensitive" } },
      ];
    }

    const [repos, total] = await Promise.all([
      prisma.templateRepo.findMany({
        where,
        include: {
          templates: {
            select: {
              id: true,
              name: true,
              slug: true,
              enabled: true,
            },
            take: 5,
          },
          _count: {
            select: {
              templates: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.templateRepo.count({ where }),
    ]);

    return NextResponse.json({
      repos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching template repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch template repositories" },
      { status: 500 }
    );
  }
}

// app/api/admin/templates/repos/route.ts (add POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform, loader, repoUrl, branch, enabled } = body;

    // Check if repo already exists for this platform/loader
    const existingRepo = await prisma.templateRepo.findUnique({
      where: { platform_loader: { platform, loader } },
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: "Repository already exists for this platform and loader" },
        { status: 400 }
      );
    }

    const repo = await prisma.templateRepo.create({
      data: {
        platform,
        loader,
        repoUrl,
        branch: branch || "main",
        enabled: enabled ?? true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `CREATED_TEMPLATE_REPO_${repo.id}`,
        metadata: {
          repoUrl: repo.repoUrl,
          platform: repo.platform,
          loader: repo.loader,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(repo);
  } catch (error) {
    console.error("Error creating template repo:", error);
    return NextResponse.json(
      { error: "Failed to create template repository" },
      { status: 500 }
    );
  }
}