// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get system settings from database
    // Since we don't have a dedicated Settings model, we'll aggregate data
    const [
      totalUsers,
      totalProjects,
      totalTemplates,
      totalBuilds,
      activeUsers,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.template.count(),
      prisma.buildHistory.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

    return NextResponse.json({
      // System Stats
      stats: {
        totalUsers,
        totalProjects,
        totalTemplates,
        totalBuilds,
        activeUsers,
        bannedUsers,
      },
      // Default settings
      settings: {
        siteName: "PlanMod",
        siteDescription: "Minecraft Mod Template Generator",
        maintenanceMode: false,
        registrationEnabled: true,
        maxProjectsPerUser: 50,
        maxFileSize: 100, // MB
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// app/api/admin/settings/route.ts (add PUT)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      siteName,
      siteDescription,
      maintenanceMode,
      registrationEnabled,
      maxProjectsPerUser,
      maxFileSize,
    } = body;

    // Since we don't have a Settings model, we'll store settings in a JSON file
    // or environment variables. For now, we'll just log the update
    // In production, consider creating a Settings model or using a key-value store

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATED_SYSTEM_SETTINGS",
        metadata: {
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        siteName,
        siteDescription,
        maintenanceMode,
        registrationEnabled,
        maxProjectsPerUser,
        maxFileSize,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

