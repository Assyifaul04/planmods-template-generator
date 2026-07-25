// app/user/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderIcon,
  BellIcon,
  ArrowRightIcon,
  HistoryIcon,
  PlusIcon,
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

interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

// Status expressed as a dot + label rather than a filled badge —
// quieter, and reads more like a system state than a decoration.
const statusConfig: Record<string, { label: string; dotClassName: string; textClassName: string }> = {
  READY: { label: "Ready", dotClassName: "bg-emerald-400", textClassName: "text-emerald-400" },
  FAILED: { label: "Failed", dotClassName: "bg-red-400", textClassName: "text-red-400" },
  DRAFT: { label: "Draft", dotClassName: "bg-yellow-400", textClassName: "text-yellow-400" },
  GENERATING: { label: "Generating", dotClassName: "bg-blue-400 animate-pulse", textClassName: "text-blue-400" },
  ARCHIVED: { label: "Archived", dotClassName: "bg-white/30", textClassName: "text-white/40" },
};

export default function UserDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [, setRecentDownloads] = useState<RecentDownload[]>([]);
  const [, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

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
      setNotifications(data.recentNotifications || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status: string) => {
    const config = statusConfig[status];
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
          {status}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium ${config.textClassName}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} />
        {config.label}
      </span>
    );
  };

  const username = session?.user?.name || "User";
  const initial = username.charAt(0).toUpperCase();
  const avatarUrl = session?.user?.image;
  const showAvatarImage = Boolean(avatarUrl) && !avatarError;
  const unreadCount = stats?.totalNotifications || 0;

  return (
    <div className="w-full space-y-5">
      {/* Profile Card */}
      <Card className="border-white/10 bg-white/[0.02] p-5 sm:p-6 transition-colors hover:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-30 w-30 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
              {showAvatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl as string}
                  alt={username}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5 text-xl font-semibold text-white">
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-white">
                {username}
              </h1>
              <button
                onClick={() => router.push(`/user/${username}`)}
                className="group mt-0.5 inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
              >
                Visit your profile
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <Button
            onClick={() => router.push("/user/generator")}
            size="sm"
            className="hidden shrink-0 bg-white text-black hover:bg-white/90 sm:inline-flex"
          >
            <PlusIcon className="mr-1.5 h-4 w-4" />
            New project
          </Button>
        </div>
      </Card>

      {/* Notifications Card */}
      <Card className="border-white/10 bg-white/[0.02] p-5 sm:p-6 transition-colors hover:bg-white/[0.03]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
              <BellIcon className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-white">
                  Notifications
                </h3>
                {!loading && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold text-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-white/50">
                {loading ? (
                  <Skeleton className="h-4 w-44 bg-white/10" />
                ) : unreadCount > 0 ? (
                  `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                ) : (
                  "You have no unread notifications."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent text-white/80 hover:bg-white/5 hover:text-white"
            onClick={() => router.push("/user/notifications")}
          >
            <HistoryIcon className="mr-2 h-4 w-4" />
            View notification history
          </Button>
        </div>
      </Card>

      {/* Recent Projects */}
      <Card className="border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">
              Recent Projects
            </h3>
            <p className="mt-0.5 text-sm text-white/50">Your latest projects</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50 hover:bg-white/5 hover:text-white"
            onClick={() => router.push("/user/projects")}
          >
            View all
            <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg bg-white/5" />
            ))}
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/[0.01] p-3.5 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                onClick={() => router.push(`/user/projects/${project.id}`)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60">
                    <FolderIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {project.name}
                    </p>
                    {project.platform && (
                      <p className="truncate text-xs text-white/40">
                        {project.platform} · {project.loader || "Mod"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 pl-3">
                  {getStatusPill(project.status)}
                  <ArrowRightIcon className="h-3.5 w-3.5 text-white/0 transition-all group-hover:text-white/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <FolderIcon className="h-4 w-4 text-white/30" />
            </div>
            <p className="mt-3 text-sm text-white/50">No projects yet</p>
            <p className="mt-1 text-xs text-white/30">
              Create your first project to see it here
            </p>
            <Button
              size="sm"
              className="mt-4 bg-white text-black hover:bg-white/90"
              onClick={() => router.push("/user/generator")}
            >
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Create project
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}