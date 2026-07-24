// app/api/user/versions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const versions = await prisma.minecraftVersion.findMany({
      where: {
        platform: "JAVA",
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        platform: true,
        isLatest: true,
        isSnapshot: true,
        releaseDate: true,
      },
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