// app/admin/tags/usage/page.tsx
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
import { ArrowLeft, RefreshCw, TrendingUp, Hash, Package, Layers } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TagUsage {
  totalTags: number;
  tagsWithTemplates: number;
  tagsWithoutTemplates: number;
  mostUsedTags: Array<{
    id: string;
    name: string;
    slug: string;
    _count: {
      templates: number;
    };
  }>;
  tagUsageByPlatform: Array<{
    tag_name: string;
    platform: string;
    count: number;
  }>;
  tagUsageByLoader: Array<{
    tag_name: string;
    loader: string;
    count: number;
  }>;
}

const COLORS = ["#facc15", "#f87171", "#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#6ee7b7"];

export default function TagUsagePage() {
  const router = useRouter();
  const [stats, setStats] = useState<TagUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/tags/usage");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching tag usage:", error);
      toast.error("Failed to fetch tag usage statistics");
    } finally {
      setLoading(false);
    }
  };

  const getLoaderColor = (loader: string) => {
    const colors: Record<string, string> = {
      FABRIC: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      FORGE: "bg-red-500/20 text-red-400 border-red-500/30",
      NEOFORGE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      QUILT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PAPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      SPIGOT: "bg-green-500/20 text-green-400 border-green-500/30",
      ADDON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return colors[loader] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading tag usage statistics...
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
          onClick={() => router.push("/admin/tags")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Tag Usage Statistics</h2>
          <p className="text-sm text-white/60 mt-1">
            Monitor how tags are used across templates
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
            <CardTitle className="text-white text-sm font-medium">Total Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalTags || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Tags with Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats?.tagsWithTemplates || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Unused Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats?.tagsWithoutTemplates || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Tags */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Most Used Tags</CardTitle>
            <CardDescription className="text-white/60">
              Top 10 most frequently used tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Tag</TableHead>
                  <TableHead className="text-white/60 text-right">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.mostUsedTags && stats.mostUsedTags.length > 0 ? (
                  stats.mostUsedTags.map((tag) => (
                    <TableRow key={tag.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-white/30" />
                          <span className="text-white">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60 text-right font-medium">
                        {tag._count.templates} templates
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-white/40">
                      No tag usage data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usage by Platform */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Usage by Platform</CardTitle>
            <CardDescription className="text-white/60">
              Tag usage distribution by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.tagUsageByPlatform || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tag_name, platform, count }) => `${tag_name} (${platform}): ${count}`}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="tag_name"
                  >
                    {(stats?.tagUsageByPlatform || []).map((entry, index) => (
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
      </div>

      {/* Usage by Loader */}
      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Usage by Loader</CardTitle>
          <CardDescription className="text-white/60">
            Tag usage distribution by loader
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Tag</TableHead>
                <TableHead className="text-white/60">Loader</TableHead>
                <TableHead className="text-white/60 text-right">Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.tagUsageByLoader && stats.tagUsageByLoader.length > 0 ? (
                stats.tagUsageByLoader.map((item, index) => (
                  <TableRow key={index} className="border-white/10">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-white/30" />
                        <span className="text-white">{item.tag_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getLoaderColor(item.loader)}>
                        {item.loader}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-right font-medium">
                      {item.count} templates
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-white/40">
                    No loader usage data available
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