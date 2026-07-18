// app/api/user/versions/route.ts
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
    const loader = searchParams.get("loader");
    const platform = searchParams.get("platform");

    const where: any = {};

    if (loader) {
      where.loaderVersions = {
        some: {
          loader: loader,
        },
      };
    }

    if (platform) {
      where.platform = platform as "JAVA" | "BEDROCK";
    }

    const versions = await prisma.minecraftVersion.findMany({
      where,
      include: {
        loaderVersions: {
          where: loader ? { loader: loader as any } : undefined,
          select: {
            loader: true,
            recommended: true,
          },
        },
      },
      orderBy: [
        { isLatest: "desc" },
        { releaseDate: "desc" },
      ],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}