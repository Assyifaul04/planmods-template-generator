// app/api/user/projects/collaborations/route.ts
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build search filter for projects
    const projectSearchFilter: any = {};
    if (search) {
      projectSearchFilter.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Get collaborations where user is a collaborator
    const [collaborations, total] = await Promise.all([
      prisma.projectCollaborator.findMany({
        where: {
          userId: session.user.id, // User adalah kolaborator
          project: {
            ...projectSearchFilter,
            // ✅ Hapus filter userId: { not: session.user.id }
            // Karena kita ingin menampilkan SEMUA project yang user diundang,
            // termasuk project milik user sendiri sekalipun (jika ada)
          },
        },
        include: {
          project: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              template: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  downloads: true,
                  stars: true,
                  builds: true,
                  collaborators: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectCollaborator.count({
        where: {
          userId: session.user.id,
          project: {
            ...projectSearchFilter,
          },
        },
      }),
    ]);

    return NextResponse.json({
      collaborations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborations" },
      { status: 500 },
    );
  }
}