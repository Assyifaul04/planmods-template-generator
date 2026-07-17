// app/admin/builds/statistics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Server, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface BuildStats {
  totalBuilds: number;
  statusCounts: Array<{
    status: string;
    _count: number;
  }>;
  platformCounts: Array<{
    platform: string;
    _count: number;
  }>;
  avgDurationMs: number;
  successRate: number;
  buildsLast7Days: number;
  buildsLast30Days: number;
}

const COLORS = ["#4ade80", "#facc15", "#60a5fa", "#f87171", "#9ca3af"];

export default function BuildStatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<BuildStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/builds/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      
      const data = await response.json();
      
      // Ensure data has all required fields with fallbacks
      setStats({
        totalBuilds: data.totalBuilds || 0,
        statusCounts: data.statusCounts || [],
        platformCounts: data.platformCounts || [],
        avgDurationMs: data.avgDurationMs || 0,
        successRate: data.successRate || 0,
        buildsLast7Days: data.buildsLast7Days || 0,
        buildsLast30Days: data.buildsLast30Days || 0,
      });
    } catch (error) {
      console.error("Error fetching build statistics:", error);
      toast.error("Failed to fetch build statistics");
      // Set empty stats to prevent undefined errors
      setStats({
        totalBuilds: 0,
        statusCounts: [],
        platformCounts: [],
        avgDurationMs: 0,
        successRate: 0,
        buildsLast7Days: 0,
        buildsLast30Days: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms === 0) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pending",
      QUEUED: "Queued",
      RUNNING: "Running",
      SUCCESS: "Success",
      FAILED: "Failed",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      SUCCESS: CheckCircle,
      FAILED: XCircle,
      RUNNING: Loader2,
      PENDING: Clock,
      QUEUED: Clock,
      CANCELLED: XCircle,
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: "#4ade80",
      FAILED: "#f87171",
      RUNNING: "#facc15",
      PENDING: "#9ca3af",
      QUEUED: "#60a5fa",
      CANCELLED: "#9ca3af",
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

  // Ensure stats is never undefined
  const safeStats = stats || {
    totalBuilds: 0,
    statusCounts: [],
    platformCounts: [],
    avgDurationMs: 0,
    successRate: 0,
    buildsLast7Days: 0,
    buildsLast30Days: 0,
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/builds")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">Build Statistics</h2>
              <p className="text-sm text-white/60 mt-1">
                Analytics and metrics for build processes
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchStats}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Builds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{safeStats.totalBuilds}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {safeStats.successRate ? safeStats.successRate.toFixed(1) : "0"}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {formatDuration(safeStats.avgDurationMs)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{safeStats.buildsLast30Days}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Build Status Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Breakdown of builds by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {safeStats.statusCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeStats.statusCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, _count }) => `${getStatusLabel(status)}: ${_count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="_count"
                    >
                      {safeStats.statusCounts.map((entry, index) => (
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
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  No build data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status List */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Status Breakdown</CardTitle>
            <CardDescription className="text-white/60">
              Detailed status statistics
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
                {safeStats.statusCounts.length > 0 ? (
                  safeStats.statusCounts.map((item) => {
                    const Icon = getStatusIcon(item.status);
                    return (
                      <TableRow key={item.status} className="border-white/10">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon 
                              className={`h-4 w-4 ${item.status === "RUNNING" ? "animate-spin" : ""}`} 
                              style={{ color: getStatusColor(item.status) }} 
                            />
                            <span className="text-white">{getStatusLabel(item.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/60 text-right">{item._count}</TableCell>
                        <TableCell className="text-white/60 text-right">
                          {safeStats.totalBuilds > 0
                            ? ((item._count / safeStats.totalBuilds) * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-white/40 py-4">
                      No build data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-white/60">
            Build activity in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-white/40">Last 7 Days</div>
                <div className="text-xl font-bold text-white">{safeStats.buildsLast7Days}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Server className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-white/40">Last 30 Days</div>
                <div className="text-xl font-bold text-white">{safeStats.buildsLast30Days}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-white/40">Average Duration</div>
                <div className="text-xl font-bold text-white">
                  {formatDuration(safeStats.avgDurationMs)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}