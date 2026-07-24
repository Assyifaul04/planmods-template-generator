// app/api/admin/versions/route.ts - Perbaiki juga yang ini
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
    const isLatest = searchParams.get("isLatest");
    const isSnapshot = searchParams.get("isSnapshot");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { version: { contains: search, mode: "insensitive" } },
        { platform: { contains: search, mode: "insensitive" } },
      ];
    }

    if (platform) {
      where.platform = platform;
    }

    if (isLatest !== null) {
      where.isLatest = isLatest === "true";
    }

    if (isSnapshot !== null) {
      where.isSnapshot = isSnapshot === "true";
    }

    const [versions, total] = await Promise.all([
      prisma.minecraftVersion.findMany({
        where,
        include: {
          loaderVersions: {
            include: {
              templates: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
            },
            take: 5,
          },
          templates: {
            select: {
              id: true,
              name: true,
            },
            take: 5,
          },
          _count: {
            select: {
              projects: true,
              templates: true,
              loaderVersions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { isLatest: "desc" },
          { version: "desc" },
        ],
      }),
      prisma.minecraftVersion.count({ where }),
    ]);

    return NextResponse.json({
      versions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
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
    const { version, platform, isLatest, isSnapshot, releaseDate } = body;

    // Check if version already exists
    const existingVersion = await prisma.minecraftVersion.findUnique({
      where: { version },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: "Version already exists" },
        { status: 400 }
      );
    }

    const newVersion = await prisma.minecraftVersion.create({
      data: {
        version,
        platform,
        isLatest: isLatest || false,
        isSnapshot: isSnapshot || false,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `CREATED_VERSION_${newVersion.id}`,
        metadata: {
          version: newVersion.version,
          platform: newVersion.platform,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(newVersion);
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}