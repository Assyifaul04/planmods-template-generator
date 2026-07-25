// app/api/user/github/webhooks/route.ts
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

    const repositories = await prisma.githubRepository.findMany({
      where: {
        userId: session.user.id,
        webhookId: {
          not: null,
        },
      },
      select: {
        id: true,
        repositoryName: true,
        repositoryUrl: true,
        webhookId: true,
        webhookSecret: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      webhooks: repositories,
      total: repositories.length,
    });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}