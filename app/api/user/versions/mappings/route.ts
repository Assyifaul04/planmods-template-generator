// app/api/user/versions/mappings/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const loader = searchParams.get("loader");
    const versionId = searchParams.get("versionId");

    if (!loader || !versionId) {
      return NextResponse.json(
        { error: "Missing loader or versionId" },
        { status: 400 }
      );
    }

    const mappings = await prisma.loaderMinecraftVersion.findMany({
      where: {
        loader: loader as any,
        minecraftVersionId: versionId,
        supported: true,
      },
      orderBy: {
        recommended: "desc",
      },
      include: {
        minecraftVersion: {
          select: {
            id: true,
            version: true,
          },
        },
      },
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