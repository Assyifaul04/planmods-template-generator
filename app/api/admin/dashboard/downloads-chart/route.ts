// app/api/admin/dashboard/downloads-chart/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "90d";
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Group real download events by day + project platform.
  // download_history -> projects.platform (JAVA | BEDROCK)
  const rows = await prisma.$queryRaw<
    { date: Date; platform: "JAVA" | "BEDROCK"; count: bigint }[]
  >`
    SELECT
      DATE_TRUNC('day', dh."downloadedAt") AS date,
      p."platform" AS platform,
      COUNT(*)::bigint AS count
    FROM "download_history" dh
    JOIN "projects" p ON p.id = dh."projectId"
    WHERE dh."downloadedAt" >= ${startDate}
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `;

  // Pivot rows into { date, java, bedrock } so the chart can stack both series
  const byDate = new Map<string, { date: string; java: number; bedrock: number }>();

  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, java: 0, bedrock: 0 });
    }
    const entry = byDate.get(key)!;
    if (row.platform === "JAVA") entry.java = Number(row.count);
    if (row.platform === "BEDROCK") entry.bedrock = Number(row.count);
  }

  // Fill in missing days with zero so the line doesn't have gaps
  const data: { date: string; java: number; bedrock: number }[] = [];
  const cursor = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    data.push(byDate.get(key) || { date: key, java: 0, bedrock: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({ data });
}