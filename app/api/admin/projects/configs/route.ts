// app/api/admin/projects/configs/route.ts
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.project = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [configs, total] = await Promise.all([
      prisma.projectConfig.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              platform: true,
              loader: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.projectConfig.count({ where }),
    ]);

    return NextResponse.json({
      configs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching project configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch project configs" },
      { status: 500 }
    );
  }
}