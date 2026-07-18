// app/api/admin/templates/usage/route.ts
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
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get templates with highest usage
    const topTemplates = await prisma.template.findMany({
      where: {
        usageCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        usageCount: true,
        platform: true,
        loader: true,
        isFeatured: true,
        enabled: true,
        templateRepo: {
          select: {
            repoUrl: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        usageCount: "desc",
      },
      take: limit,
    });

    // Get usage by platform
    const usageByPlatform = await prisma.template.groupBy({
      by: ["platform"],
      _sum: {
        usageCount: true,
      },
      orderBy: {
        _sum: {
          usageCount: "desc",
        },
      },
    });

    // Get usage by loader
    const usageByLoader = await prisma.template.groupBy({
      by: ["loader"],
      _sum: {
        usageCount: true,
      },
      orderBy: {
        _sum: {
          usageCount: "desc",
        },
      },
    });

    const totalUsage = await prisma.template.aggregate({
      _sum: {
        usageCount: true,
      },
    });

    return NextResponse.json({
      topTemplates,
      usageByPlatform,
      usageByLoader,
      totalUsage: totalUsage._sum.usageCount || 0,
    });
  } catch (error) {
    console.error("Error fetching template usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch template usage" },
      { status: 500 }
    );
  }
}