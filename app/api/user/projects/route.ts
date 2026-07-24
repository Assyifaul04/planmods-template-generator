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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const visibility = searchParams.get("visibility");

    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
      // Exclude archived projects from list
      status: {
        not: "ARCHIVED"
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ARCHIVED") {
      where.status = status;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              downloads: true,
              stars: true,
              builds: true,
              collaborators: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}