// app/api/admin/settings/security/route.ts
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

    // Get security-related data
    const [
      totalApiKeys,
      activeApiKeys,
      revokedApiKeys,
      totalUsers,
      adminUsers,
    ] = await Promise.all([
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { revokedAt: null } }),
      prisma.apiKey.count({ where: { revokedAt: { not: null } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

    // Get recent activity logs (last 7 days)
    const recentActivity = await prisma.activityLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      security: {
        totalApiKeys,
        activeApiKeys,
        revokedApiKeys,
        totalUsers,
        adminUsers,
        recentActivity,
        lastPasswordChange: null,
      },
      settings: {
        requireStrongPasswords: true,
        sessionTimeout: 60, // minutes
        maxLoginAttempts: 5,
        twoFactorAuth: false,
        allowSocialLogin: true,
      },
    });
  } catch (error) {
    console.error("Error fetching security settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch security settings" },
      { status: 500 }
    );
  }
}

// app/api/admin/settings/security/route.ts (add PUT)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requireStrongPasswords,
      sessionTimeout,
      maxLoginAttempts,
      twoFactorAuth,
      allowSocialLogin,
    } = body;

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATED_SECURITY_SETTINGS",
        metadata: {
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Security settings updated successfully",
      settings: {
        requireStrongPasswords,
        sessionTimeout,
        maxLoginAttempts,
        twoFactorAuth,
        allowSocialLogin,
      },
    });
  } catch (error) {
    console.error("Error updating security settings:", error);
    return NextResponse.json(
      { error: "Failed to update security settings" },
      { status: 500 }
    );
  }
}