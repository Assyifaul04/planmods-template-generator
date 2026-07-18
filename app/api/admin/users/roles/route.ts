// app/api/admin/users/roles/route.ts
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

    const roleStats = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            downloads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      roleDistribution: roleStats,
      adminUsers,
      totalUsers,
      adminCount: roleStats.find(r => r.role === "ADMIN")?._count || 0,
      userCount: roleStats.find(r => r.role === "USER")?._count || 0,
    });
  } catch (error) {
    console.error("Error fetching role statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch role statistics" },
      { status: 500 }
    );
  }
}