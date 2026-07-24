// app/api/admin/versions/mappings/route.ts - Perbaiki juga
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
    const loader = searchParams.get("loader");
    const versionId = searchParams.get("versionId");
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (loader) {
      where.loader = loader;
    }

    if (versionId) {
      where.minecraftVersionId = versionId;
    }

    if (search) {
      where.OR = [
        { loader: { contains: search, mode: "insensitive" } },
        { loaderVersion: { contains: search, mode: "insensitive" } },
        { 
          minecraftVersion: { 
            version: { contains: search, mode: "insensitive" } 
          } 
        },
      ];
    }

    const mappings = await prisma.loaderMinecraftVersion.findMany({
      where,
      include: {
        minecraftVersion: {
          select: {
            id: true,
            version: true,
            platform: true,
          },
        },
        templates: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { loader: "asc" },
        { minecraftVersion: { version: "desc" } },
      ],
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error("Error fetching loader mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch loader mappings" },
      { status: 500 }
    );
  }
}