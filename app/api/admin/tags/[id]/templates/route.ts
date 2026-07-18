// app/api/admin/tags/[id]/templates/route.ts
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

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      include: {
        templates: {
          include: {
            template: {
              include: {
                mcVersionData: {
                  select: {
                    version: true,
                    platform: true,
                  },
                },
                templateRepo: {
                  select: {
                    repoUrl: true,
                  },
                },
                _count: {
                  select: {
                    projects: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching templates by tag:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates by tag" },
      { status: 500 }
    );
  }
}