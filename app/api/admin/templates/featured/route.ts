// app/api/admin/templates/featured/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get featured templates
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

    const where: any = {
      isFeatured: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
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
          _count: {
            select: {
              projects: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { usageCount: "desc" },
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
    console.error("Error fetching featured templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured templates" },
      { status: 500 }
    );
  }
}