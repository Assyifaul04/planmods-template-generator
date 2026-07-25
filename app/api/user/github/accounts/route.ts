// app/api/user/github/accounts/route.ts
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        githubId: true,
        githubUsername: true,
        image: true,
      },
    });

    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        provider: {
          in: ["github", "google", "discord"],
        },
      },
      select: {
        provider: true,
        providerAccountId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user,
      accounts,
      connectedAccounts: accounts.map((acc) => acc.provider),
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}