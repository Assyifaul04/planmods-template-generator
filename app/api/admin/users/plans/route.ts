// app/api/admin/users/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        plan: true,
      },
    });

    const usersByPlan = await Promise.all(
      plans.map(async (plan) => {
        const users = await prisma.user.findMany({
          where: { plan: plan.plan },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            createdAt: true,
          },
          take: 10,
        });
        return {
          plan: plan.plan,
          count: plan._count.plan,
          users,
        };
      })
    );

    return NextResponse.json(usersByPlan);
  } catch (error) {
    console.error("Error fetching user plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch user plans" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId and plan are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `UPDATED_USER_PLAN_${userId}`,
        metadata: {
          newPlan: plan,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      { error: "Failed to update user plan" },
      { status: 500 }
    );
  }
}