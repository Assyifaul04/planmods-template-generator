// app/api/admin/tags/usage/route.ts
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

    const [
      totalTags,
      tagsWithTemplates,
      tagsWithoutTemplates,
      mostUsedTags,
      tagUsageByPlatform,
      tagUsageByLoader,
    ] = await Promise.all([
      prisma.tag.count(),
      prisma.tag.count({
        where: {
          templates: {
            some: {},
          },
        },
      }),
      prisma.tag.count({
        where: {
          templates: {
            none: {},
          },
        },
      }),
      prisma.tag.findMany({
        include: {
          _count: {
            select: {
              templates: true,
            },
          },
        },
        orderBy: {
          templates: {
            _count: "desc",
          },
        },
        take: 10,
      }),
      // Get tags usage by platform
      prisma.$queryRaw`
        SELECT 
          t.name as tag_name,
          tmpl.platform,
          COUNT(*) as count
        FROM tags t
        JOIN template_tags tt ON t.id = tt."tagId"
        JOIN templates tmpl ON tt."templateId" = tmpl.id
        GROUP BY t.name, tmpl.platform
        ORDER BY count DESC
      `,
      // Get tags usage by loader
      prisma.$queryRaw`
        SELECT 
          t.name as tag_name,
          tmpl.loader,
          COUNT(*) as count
        FROM tags t
        JOIN template_tags tt ON t.id = tt."tagId"
        JOIN templates tmpl ON tt."templateId" = tmpl.id
        GROUP BY t.name, tmpl.loader
        ORDER BY count DESC
      `,
    ]);

    return NextResponse.json({
      totalTags,
      tagsWithTemplates,
      tagsWithoutTemplates,
      mostUsedTags,
      tagUsageByPlatform,
      tagUsageByLoader,
    });
  } catch (error) {
    console.error("Error fetching tag usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag usage" },
      { status: 500 }
    );
  }
}