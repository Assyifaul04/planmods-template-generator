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
    const templateRepoId = searchParams.get("templateRepoId");

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

    if (templateRepoId) {
      where.templateRepoId = templateRepoId;
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          templateRepo: {
            select: {
              id: true,
              repoUrl: true,
              platform: true,
              loader: true,
            },
          },
          mcVersionData: {
            select: {
              version: true,
              platform: true,
              isLatest: true,
            },
          },
          LoaderMinecraftVersion: {
            select: {
              id: true,
              loader: true,
              loaderVersion: true,
              recommended: true,
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
      templateRepoId,
      repoUrl,
      gradleUrl,
      enabled,
      isFeatured,
      loaderMinecraftVersionId,
      tagIds,
    } = body;

    // Validate required fields
    const errors: string[] = [];
    
    if (!name || name.trim() === "") errors.push("name");
    if (!slug || slug.trim() === "") errors.push("slug");
    if (!platform) errors.push("platform");
    if (!loader) errors.push("loader");
    if (!minecraftVersion || minecraftVersion.trim() === "") errors.push("minecraftVersion");
    if (!path || path.trim() === "") errors.push("path");

    if (errors.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${errors.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if Minecraft version exists - if not, create it automatically
    let versionExists = await prisma.minecraftVersion.findUnique({
      where: { version: minecraftVersion },
    });

    if (!versionExists) {
      versionExists = await prisma.minecraftVersion.create({
        data: {
          version: minecraftVersion,
          platform: platform,
          isLatest: false,
          isSnapshot: false,
          releaseDate: new Date(),
        },
      });
    }

    // Check if slug is unique
    const existingTemplate = await prisma.template.findUnique({
      where: { slug },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: `Template with slug "${slug}" already exists` },
        { status: 400 }
      );
    }

    // Check if loaderMinecraftVersionId exists if provided
    let validLoaderVersionId = null;
    if (loaderMinecraftVersionId && loaderMinecraftVersionId.trim() !== "") {
      const loaderVersionExists = await prisma.loaderMinecraftVersion.findUnique({
        where: { id: loaderMinecraftVersionId },
      });
      
      if (!loaderVersionExists) {
        return NextResponse.json(
          { error: `Loader Minecraft version with ID "${loaderMinecraftVersionId}" does not exist` },
          { status: 400 }
        );
      }
      validLoaderVersionId = loaderMinecraftVersionId;
    }

    // Build the data object
    const data: any = {
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      thumbnailUrl: thumbnailUrl?.trim() || null,
      platform,
      loader,
      minecraftVersion: minecraftVersion.trim(),
      path: path.trim(),
      repoUrl: repoUrl?.trim() || null,
      gradleUrl: gradleUrl?.trim() || null,
      enabled: enabled !== undefined ? enabled : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
    };

    // Only include templateRepoId if it's a valid non-empty string
    if (templateRepoId && templateRepoId.trim() !== "") {
      const repoExists = await prisma.templateRepo.findUnique({
        where: { id: templateRepoId },
      });
      if (repoExists) {
        data.templateRepoId = templateRepoId;
      }
    }

    // Only include loaderMinecraftVersionId if it's valid
    if (validLoaderVersionId) {
      data.loaderMinecraftVersionId = validLoaderVersionId;
    }

    const template = await prisma.template.create({
      data: {
        ...data,
        tags: {
          create: tagIds?.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })) || [],
        },
      },
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
        action: `CREATED_TEMPLATE_${template.id}`,
        metadata: {
          templateName: template.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error creating template:", error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Foreign key constraint failed. Please check that all referenced IDs exist." },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A template with this slug already exists." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}