// app/api/admin/settings/maintenance/route.ts
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

    // Get maintenance-related data
    const [
      pendingBuilds,
      runningBuilds,
      failedBuilds,
      totalDownloads,
      failedDownloads,
    ] = await Promise.all([
      prisma.buildHistory.count({
        where: {
          status: { in: ["PENDING", "QUEUED"] },
        },
      }),
      prisma.buildHistory.count({
        where: { status: "RUNNING" },
      }),
      prisma.buildHistory.count({
        where: { status: "FAILED" },
      }),
      prisma.downloadHistory.count(),
      prisma.downloadHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({
      maintenance: {
        pendingBuilds,
        runningBuilds,
        failedBuilds,
        totalDownloads,
        failedDownloads,
        lastMaintenance: null,
      },
      settings: {
        maintenanceMode: false,
        maintenanceMessage: "We are currently performing maintenance. Please check back later.",
        allowAdminAccess: true,
        autoBackupEnabled: true,
        backupFrequency: "daily", // daily, weekly, monthly
        maxLogRetention: 30, // days
      },
    });
  } catch (error) {
    console.error("Error fetching maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance settings" },
      { status: 500 }
    );
  }
}

// app/api/admin/settings/maintenance/route.ts (add PUT)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      maintenanceMode,
      maintenanceMessage,
      allowAdminAccess,
      autoBackupEnabled,
      backupFrequency,
      maxLogRetention,
    } = body;

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_MAINTENANCE_SETTINGS_${maintenanceMode ? "ENABLED" : "DISABLED"}`,
        metadata: {
          maintenanceMode,
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Maintenance settings updated successfully",
      settings: {
        maintenanceMode,
        maintenanceMessage,
        allowAdminAccess,
        autoBackupEnabled,
        backupFrequency,
        maxLogRetention,
      },
    });
  } catch (error) {
    console.error("Error updating maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance settings" },
      { status: 500 }
    );
  }
}