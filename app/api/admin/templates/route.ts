// app/api/admin/templates/route.ts
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
    const platform = searchParams.get("platform");
    const loader = searchParams.get("loader");
    const isFeatured = searchParams.get("isFeatured");
    const enabled = searchParams.get("enabled");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (platform) {
      where.platform = platform;
    }

    if (loader) {
      where.loader = loader;
    }

    if (isFeatured !== null) {
      where.isFeatured = isFeatured === "true";
    }

    if (enabled !== null) {
      where.enabled = enabled === "true";
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// app/api/admin/templates/route.ts (add POST)
export async function POST(request: NextRequest) {
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

    // Check if slug is unique
    const existingTemplate = await prisma.template.findUnique({
      where: { slug },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template with this slug already exists" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        slug,
        description,
        thumbnailUrl,
        platform,
        loader,
        minecraftVersion,
        path,
        enabled: enabled ?? true,
        isFeatured: isFeatured ?? false,
        tags: {
          create: tagIds?.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })) || [],
        },
      },
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
        action: `CREATED_TEMPLATE_${template.id}`,
        metadata: {
          templateName: template.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}