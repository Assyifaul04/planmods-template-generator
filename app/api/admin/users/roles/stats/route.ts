// app/api/admin/users/roles/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, adminCount, userCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "USER" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      adminCount,
      userCount,
    });
  } catch (error) {
    console.error("Error fetching role stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch role statistics" },
      { status: 500 }
    );
  }
}