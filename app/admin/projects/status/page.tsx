// app/admin/projects/status/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface StatusStats {
  totalProjects: number;
  statusCounts: Array<{
    status: string;
    _count: number;
  }>;
  platformCounts: Array<{
    platform: string;
    _count: number;
  }>;
}

export default function ProjectStatusPage() {
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusStats();
  }, []);

  const fetchStatusStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/projects/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      toast.error("Failed to fetch project statistics");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500",
      GENERATING: "bg-blue-500",
      READY: "bg-green-500",
      FAILED: "bg-red-500",
      ARCHIVED: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      GENERATING: "Generating",
      READY: "Ready",
      FAILED: "Failed",
      ARCHIVED: "Archived",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading statistics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Project Status</h2>
          <p className="text-sm text-white/60 mt-1">
            Overview of project status distribution and statistics
          </p>
        </div>
        <Badge className="bg-white/10 text-white border-white/20">
          Total: {stats?.totalProjects || 0} Projects
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalProjects || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Ready Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.statusCounts.find(s => s.status === "READY")?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Failed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats?.statusCounts.find(s => s.status === "FAILED")?._count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Status Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Projects by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.statusCounts || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="status" stroke="#ffffff40" />
                  <YAxis stroke="#ffffff40" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="_count" fill="#8884d8">
                    {stats?.statusCounts.map((entry, index) => (
                      <Bar key={index} dataKey="_count" fill={getStatusColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Platform Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Projects by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Platform</TableHead>
                  <TableHead className="text-white/60 text-right">Count</TableHead>
                  <TableHead className="text-white/60 text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.platformCounts.map((item) => (
                  <TableRow key={item.platform} className="border-white/10">
                    <TableCell className="text-white">{item.platform}</TableCell>
                    <TableCell className="text-white/60 text-right">{item._count}</TableCell>
                    <TableCell className="text-white/60 text-right">
                      {stats.totalProjects > 0
                        ? ((item._count / stats.totalProjects) * 100).toFixed(1)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.platformCounts || stats.platformCounts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-white/40 py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status List */}
      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Status Details</CardTitle>
          <CardDescription className="text-white/60">
            Detailed breakdown of projects by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Count</TableHead>
                <TableHead className="text-white/60 text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.statusCounts.map((item) => (
                <TableRow key={item.status} className="border-white/10">
                  <TableCell>
                    <Badge className={`${getStatusColor(item.status)}/20 text-${getStatusColor(item.status).replace('bg-', '')} border-${getStatusColor(item.status)}/30`}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60 text-right">{item._count}</TableCell>
                  <TableCell className="text-white/60 text-right">
                    {stats.totalProjects > 0
                      ? ((item._count / stats.totalProjects) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
              ))}
              {(!stats?.statusCounts || stats.statusCounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-white/40 py-4">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}