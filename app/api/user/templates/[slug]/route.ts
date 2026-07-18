// app/api/user/templates/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.template.findUnique({
      where: { 
        slug: params.slug,
        enabled: true,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            visibility: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: 5,
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}