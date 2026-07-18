// app/api/admin/tags/route.ts
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
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          templates: {
            include: {
              template: {
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
      prisma.tag.count({ where }),
    ]);

    return NextResponse.json({
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// app/api/admin/tags/route.ts (add POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    // Check if name or slug already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag with this name or slug already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name, slug },
      include: {
        templates: {
          include: {
            template: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `CREATED_TAG_${tag.id}`,
        metadata: {
          tagName: tag.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

