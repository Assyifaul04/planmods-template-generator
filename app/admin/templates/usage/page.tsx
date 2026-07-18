// app/admin/templates/usage/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Package, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface UsageStats {
  topTemplates: Array<{
    id: string;
    name: string;
    slug: string;
    usageCount: number;
    platform: string;
    loader: string;
    isFeatured: boolean;
    enabled: boolean;
    templateRepo: {
      repoUrl: string;
    } | null;
    _count: {
      projects: number;
    };
  }>;
  usageByPlatform: Array<{
    platform: string;
    _sum: {
      usageCount: number;
    };
  }>;
  usageByLoader: Array<{
    loader: string;
    _sum: {
      usageCount: number;
    };
  }>;
  totalUsage: number;
}

const COLORS = ["#facc15", "#f87171", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"];

export default function TemplateUsagePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/templates/usage");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      toast.error("Failed to fetch usage statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading usage statistics...
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
          onClick={() => router.push("/admin/templates")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Template Usage</h2>
          <p className="text-sm text-white/60 mt-1">
            Monitor template usage and popularity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchUsageStats}
          className="ml-auto border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsage || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Most Used Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {stats?.usageByPlatform[0]?.platform || "N/A"}
            </div>
            <div className="text-xs text-white/40">
              {stats?.usageByPlatform[0]?._sum.usageCount || 0} uses
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Most Used Loader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {stats?.usageByLoader[0]?.loader || "N/A"}
            </div>
            <div className="text-xs text-white/40">
              {stats?.usageByLoader[0]?._sum.usageCount || 0} uses
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Platform */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Usage by Platform</CardTitle>
            <CardDescription className="text-white/60">
              Template usage distribution by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.usageByPlatform || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ platform, _sum }) => `${platform}: ${_sum.usageCount}`}
                    outerRadius={80}
                    dataKey="_sum.usageCount"
                  >
                    {(stats?.usageByPlatform || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </div>
          </CardContent>
        </Card>

        {/* Usage by Loader */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Usage by Loader</CardTitle>
            <CardDescription className="text-white/60">
              Template usage distribution by loader
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.usageByLoader || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="loader" stroke="#ffffff40" />
                  <YAxis stroke="#ffffff40" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="_sum.usageCount" fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Templates */}
      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Top Templates</CardTitle>
          <CardDescription className="text-white/60">
            Most used templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Template</TableHead>
                <TableHead className="text-white/60">Platform</TableHead>
                <TableHead className="text-white/60">Loader</TableHead>
                <TableHead className="text-white/60 text-right">Usage</TableHead>
                <TableHead className="text-white/60 text-right">Projects</TableHead>
                <TableHead className="text-white/60 text-center">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.topTemplates && stats.topTemplates.length > 0 ? (
                stats.topTemplates.map((template) => (
                  <TableRow key={template.id} className="border-white/10">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{template.name}</div>
                        <div className="text-xs text-white/40">{template.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-white/60 border-white/20">
                        {template.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-white/60 border-white/20">
                        {template.loader}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-right font-medium">
                      {template.usageCount}
                    </TableCell>
                    <TableCell className="text-white/60 text-right">
                      {template._count.projects}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {template.isFeatured && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                            Featured
                          </Badge>
                        )}
                        {template.enabled ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/templates/${template.id}`)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    No usage data available
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