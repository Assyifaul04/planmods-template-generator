// app/api/admin/versions/[id]/loaders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loaders = await prisma.loaderMinecraftVersion.findMany({
      where: { minecraftVersionId: params.id },
      include: {
        minecraftVersion: {
          select: {
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
      orderBy: { loader: "asc" },
    });

    return NextResponse.json(loaders);
  } catch (error) {
    console.error("Error fetching loaders:", error);
    return NextResponse.json(
      { error: "Failed to fetch loaders" },
      { status: 500 }
    );
  }
}