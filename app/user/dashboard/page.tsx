// app/user/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusIcon,
  FolderIcon,
  DownloadIcon,
  StarIcon,
  BellIcon,
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  FileEditIcon,
  RefreshCwIcon,
  ArchiveIcon,
} from "lucide-react";

interface DashboardStats {
  totalProjects: number;
  totalDownloads: number;
  totalStars: number;
  totalBuilds: number;
  totalNotifications: number;
  draftProjects: number;
  readyProjects: number;
  failedProjects: number;
}

interface RecentProject {
  id: string;
  name: string;
  platform?: string;
  loader?: string;
  status: string;
  createdAt: string;
}

interface RecentDownload {
  id: string;
  downloadedAt: string;
  project?: { name: string };
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  READY: { label: "Ready", icon: CheckCircle2Icon, className: "text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircleIcon, className: "text-red-400" },
  DRAFT: { label: "Draft", icon: FileEditIcon, className: "text-yellow-400" },
  GENERATING: { label: "Generating", icon: RefreshCwIcon, className: "text-blue-400" },
  ARCHIVED: { label: "Archived", icon: ArchiveIcon, className: "text-white/40" },
};

export default function UserDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentDownloads, setRecentDownloads] = useState<RecentDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/dashboard");
      const data = await response.json();
      setStats(data.stats);
      setRecentProjects(data.recentProjects || []);
      setRecentDownloads(data.recentDownloads || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Projects", value: stats?.totalProjects ?? 0, icon: FolderIcon },
    { label: "Downloads", value: stats?.totalDownloads ?? 0, icon: DownloadIcon },
    { label: "Stars", value: stats?.totalStars ?? 0, icon: StarIcon },
    { label: "Builds", value: stats?.totalBuilds ?? 0, icon: ActivityIcon },
  ];

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`border-none ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Welcome back, {session?.user?.name || "User"}
          </h1>
          <p className="text-sm text-white/40">Overview of your projects and activity</p>
        </div>
        <Button
          onClick={() => router.push("/user/projects/create")}
          className="bg-white text-black hover:bg-white/90"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">{stat.label}</p>
                <p className="text-xl font-semibold text-white mt-0.5">
                  {loading ? <Skeleton className="h-6 w-8 bg-white/10" /> : stat.value}
                </p>
              </div>
              <stat.icon className="h-4 w-4 text-white/30" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-white">Recent Projects</h3>
              <p className="text-xs text-white/40">Your latest projects</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white hover:bg-white/5"
              onClick={() => router.push("/user/projects")}
            >
              View all <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/5" />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-3 hover:bg-white/5"
                  onClick={() => router.push(`/user/projects/${project.id}`)}
                >
                  <div>
                    <p className="text-sm text-white">{project.name}</p>
                    {project.platform && (
                      <p className="text-xs text-white/40">
                        {project.platform} · {project.loader || "Mod"}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FolderIcon className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-2 text-sm text-white/40">No projects yet</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-white/10 text-white hover:bg-white/10"
                onClick={() => router.push("/user/projects/create")}
              >
                Create one
              </Button>
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project Status */}
          <Card className="border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-white mb-3">Project Status</h3>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full bg-white/10" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Draft</span>
                  <span className="text-white">{stats?.draftProjects || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Ready</span>
                  <span className="text-emerald-400">{stats?.readyProjects || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Failed</span>
                  <span className="text-red-400">{stats?.failedProjects || 0}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-sm">
                  <span className="text-white/40">Total</span>
                  <span className="text-white font-medium">{stats?.totalProjects || 0}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Notifications */}
          <Card className="border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/40">Notifications</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white hover:bg-white/5"
                onClick={() => router.push("/user/notifications")}
              >
                {loading ? (
                  <Skeleton className="h-4 w-8 bg-white/10" />
                ) : (
                  `${stats?.totalNotifications || 0} unread`
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">Recent Activity</h3>
            <p className="text-xs text-white/40">Your latest downloads</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white hover:bg-white/5"
            onClick={() => router.push("/user/downloads")}
          >
            View all <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/5" />
            ))}
          </div>
        ) : recentDownloads.length > 0 ? (
          <div className="space-y-2">
            {recentDownloads.map((download) => (
              <div
                key={download.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-3"
              >
                <DownloadIcon className="h-4 w-4 text-emerald-400/60" />
                <div className="flex-1">
                  <p className="text-sm text-white">
                    Downloaded {download.project?.name || "a project"}
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(download.downloadedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-white/30 border-white/10">
                  ZIP
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <ActivityIcon className="mx-auto h-8 w-8 text-white/20" />
            <p className="mt-2 text-sm text-white/40">No recent activity</p>
          </div>
        )}
      </Card>
    </div>
  );
}