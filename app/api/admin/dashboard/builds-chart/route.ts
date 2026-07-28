// app/api/admin/dashboard/builds-chart/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const builds = await prisma.buildHistory.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, status: true },
  });

  const buckets = DAY_LABELS.map((day) => ({ day, success: 0, failed: 0 }));

  for (const build of builds) {
    const dayIndex = build.createdAt.getDay(); // 0 = Sunday
    if (build.status === "SUCCESS") buckets[dayIndex].success += 1;
    if (build.status === "FAILED") buckets[dayIndex].failed += 1;
  }

  // Reorder so the week starts on Monday, matching the reference chart
  const ordered = [...buckets.slice(1), buckets[0]];

  return NextResponse.json({ data: ordered });
}