// app/api/user/templates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Platform, Loader } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const platform = searchParams.get("platform");
    const loader = searchParams.get("loader");
    const minecraftVersion = searchParams.get("minecraftVersion");
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {
      enabled: true,
    };

    // ============================
    // Search
    // ============================

    if (search.length > 0) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // ============================
    // Filters
    // ============================

    if (platform) {
      where.platform = platform as Platform;
    }

    if (loader) {
      where.loader = loader as Loader;
    }

    if (minecraftVersion) {
      where.minecraftVersion = minecraftVersion;
    }

    // ============================
    // Query
    // ============================

    const templates = await prisma.template.findMany({
      where,

      include: {
        templateRepo: true,

        mcVersionData: true,

        LoaderMinecraftVersion: true,

        tags: {
          include: {
            tag: true,
          },
        },
      },

      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          usageCount: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      total: templates.length,
      templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch templates",
      },
      {
        status: 500,
      }
    );
  }
}