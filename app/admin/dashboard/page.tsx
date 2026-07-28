// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  RefreshCw,
  Loader2,
  Database,
  Users,
  FolderGit,
  GitBranch,
  Download,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { ChartTooltip } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Legend,
  YAxis,
  CartesianGrid,
  XAxis,
} from "recharts";
import { SectionCards } from "@/components/admin/section-cards";
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive";
import { ChartBarTooltip } from "@/components/admin/chart-bar-tooltip";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalProjects: number;
  totalUsers: number;
  totalRepositories: number;
  totalDownloads: number;
  totalStars: number;
  activeProjects: number;
  privateRepos: number;
  publicRepos: number;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
  projectStats: Array<{
    status: string;
    count: number;
  }>;
  platformDistribution: Array<{
    platform: string;
    count: number;
  }>;
  loaderDistribution: Array<{
    loader: string;
    count: number;
  }>;
}

// Monochrome palette — darkest to lightest, used consistently across all charts
const MONO_COLORS = [
  "#000000",
  "#262626",
  "#404040",
  "#595959",
  "#737373",
  "#8c8c8c",
  "#a6a6a6",
  "#bfbfbf",
];

const STATUS_COLORS: Record<string, string> = {
  READY: "#000000",
  GENERATING: "#404040",
  DRAFT: "#737373",
  FAILED: "#171717",
  ARCHIVED: "#bfbfbf",
};

const ACTION_ICONS: Record<string, any> = {
  CREATE: CheckCircle2,
  DELETE: XCircle,
  UPDATE: RefreshCw,
  SYNC: RefreshCw,
  default: Activity,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard/stats`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch stats");

      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getActivityIcon = (action: string) => {
    const key = Object.keys(ACTION_ICONS).find((k) => action.includes(k));
    return ACTION_ICONS[key as keyof typeof ACTION_ICONS] || ACTION_ICONS.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Database className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-lg font-medium text-muted-foreground">No data available</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time overview of your platform performance
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Section Cards */}
      <SectionCards />

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderGit className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.activeProjects / stats.totalProjects) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Repositories
            </CardTitle>
            <GitBranch className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.publicRepos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.privateRepos} private repositories
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stars
            </CardTitle>
            <Star className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalStars.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all repositories
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Downloads
            </CardTitle>
            <Download className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalDownloads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total downloads all time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Downloads Chart — real data, Java vs Bedrock, own time-range toggle */}
        <ChartAreaInteractive />

        {/* Project Status Distribution */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FolderGit className="h-5 w-5" />
              Project Status
            </CardTitle>
            <CardDescription>Distribution of project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.projectStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    dataKey="status"
                    type="category"
                    className="text-xs"
                    width={100}
                  />
                  <ChartTooltip contentClassName="border-border/50 bg-background/95 backdrop-blur" />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.projectStats.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || MONO_COLORS[0]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Platform Distribution */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Platform Distribution
            </CardTitle>
            <CardDescription>Projects by platform type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.platformDistribution}
                    dataKey="count"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ platform, percent }) =>
                      `${platform} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {stats.platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip contentClassName="border-border/50 bg-background/95 backdrop-blur" />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loader Distribution */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <GitBranch className="h-5 w-5" />
              Loader Distribution
            </CardTitle>
            <CardDescription>Projects by loader type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.loaderDistribution}
                    dataKey="count"
                    nameKey="loader"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ loader, percent }) =>
                      `${loader} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {stats.loaderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip contentClassName="border-border/50 bg-background/95 backdrop-blur" />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build Activity + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Build Activity — real data, success vs failed per day */}
        <div className="lg:col-span-1">
          <ChartBarTooltip />
        </div>

        {/* Recent Activity */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest actions on the platform</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 text-foreground border-foreground/30">
                <Clock className="h-3 w-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mb-2 opacity-20" />
                  <p>No recent activity</p>
                </div>
              ) : (
                stats.recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.action);

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-start gap-4 pb-4",
                        index !== stats.recentActivity.length - 1 && "border-b border-border/60"
                      )}
                    >
                      <div className="mt-0.5 text-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate text-foreground">
                            {activity.user.name || activity.user.email || "Unknown User"}
                          </p>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {activity.action.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}