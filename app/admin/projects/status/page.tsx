// app/admin/projects/status/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";

interface StatusStats {
  totalProjects: number;
  statusCounts: Array<{
    status: string;
    _count: number;
  }>;
  visibilityCounts: Array<{
    visibility: string;
    _count: number;
  }>;
  platformCounts: Array<{
    platform: string;
    _count: number;
  }>;
  loaderCounts: Array<{
    loader: string;
    _count: number;
  }>;
  projectsWithGithub: number;
  projectsWithConfig: number;
  avgDownloads: number;
}

const COLORS = ["#4ade80", "#facc15", "#60a5fa", "#f87171", "#9ca3af"];

export default function ProjectStatusPage() {
  const router = useRouter();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "#9ca3af",
      GENERATING: "#60a5fa",
      READY: "#4ade80",
      FAILED: "#f87171",
      ARCHIVED: "#facc15",
    };
    return colors[status] || "#9ca3af";
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
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/projects")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Project Status</h2>
          <p className="text-sm text-white/60 mt-1">
            Overview of project status distribution and statistics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-white text-sm font-medium">With GitHub</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats?.projectsWithGithub || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">With Config</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.projectsWithConfig || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Avg Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.avgDownloads ? stats.avgDownloads.toFixed(1) : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <RePieChart>
                  <Pie
                    data={stats?.statusCounts || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, _count }) => `${getStatusLabel(status)}: ${_count}`}
                    outerRadius={80}
                    dataKey="_count"
                  >
                    {(stats?.statusCounts || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Platform Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Projects by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.platformCounts || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="platform" stroke="#ffffff40" />
                  <YAxis stroke="#ffffff40" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="_count" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <Badge style={{ backgroundColor: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}