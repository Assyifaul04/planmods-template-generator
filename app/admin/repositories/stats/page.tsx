// app/admin/repositories/stats/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  GitBranch,
  Globe,
  Lock,
  Webhook,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  Database,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Stats {
  total: {
    repositories: number;
    private: number;
    public: number;
    withWebhooks: number;
    withoutWebhooks: number;
    recentlySynced: number;
    needsSync: number;
    projects: number;
    withGithub: number;
    withoutGithub: number;
  };
  topUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    repositoryCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export default function RepositoryStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const { toast } = useToast();
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/repositories/stats?days=${days}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch stats");

      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repository Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of GitHub repository metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 border rounded-md bg-background"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.repositories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total.private} private, {stats.total.public} public
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Webhook Coverage</CardTitle>
            <Webhook className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.total.withWebhooks / stats.total.repositories) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total.withWebhooks} active, {stats.total.withoutWebhooks} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.recentlySynced}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total.needsSync} need sync
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Project Integration</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.total.withGithub / stats.total.projects) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total.withGithub} with GitHub
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Users</CardTitle>
            <CardDescription>Users with most repositories</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Repositories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.topUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || user.email}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{user.repositoryCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest repository actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="mt-0.5">
                      {activity.action.includes("SYNCED") ? (
                        <RefreshCw className="h-4 w-4 text-green-500" />
                      ) : activity.action.includes("WEBHOOK") ? (
                        <Webhook className="h-4 w-4 text-blue-500" />
                      ) : activity.action.includes("DELETED") ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {activity.user.name || activity.user.email}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "PPp", {
                            locale: id,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.action.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Private Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.private}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.total.private / stats.total.repositories) * 100)}% of
              total repositories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Public Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.public}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.total.public / stats.total.repositories) * 100)}% of
              total repositories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.needsSync}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Repositories requiring sync or webhook setup
            </p>
            <Button
              variant="link"
              className="p-0 h-auto text-primary mt-2"
              onClick={() => router.push("/admin/repositories/failed")}
            >
              View failed syncs
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}