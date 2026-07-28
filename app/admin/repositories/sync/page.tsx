// app/admin/repositories/sync/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  GitBranch,
  Globe,
  Lock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SyncStats {
  total: {
    repositories: number;
    private: number;
    public: number;
    withWebhooks: number;
    withoutWebhooks: number;
    recentlySynced: number;
    needsSync: number;
  };
}

interface Repository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  private: boolean;
  lastSyncedAt: string | null;
  webhookId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
    visibility: string;
  } | null;
}

export default function SyncStatusPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "synced" | "needs-sync" | "never">("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch("/api/admin/repositories/stats?days=7");
      const statsData = await statsRes.json();
      
      if (!statsRes.ok) throw new Error(statsData.error || "Failed to fetch stats");
      
      // Fetch repositories
      const reposRes = await fetch("/api/admin/repositories?limit=100");
      const reposData = await reposRes.json();
      
      if (!reposRes.ok) throw new Error(reposData.error || "Failed to fetch repositories");

      setStats(statsData);

      // Filter repositories based on filter
      let filteredRepos = reposData.repositories || [];
      
      if (filter === "synced") {
        filteredRepos = filteredRepos.filter(
          (r: Repository) =>
            r.lastSyncedAt &&
            new Date(r.lastSyncedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
      } else if (filter === "needs-sync") {
        filteredRepos = filteredRepos.filter(
          (r: Repository) =>
            r.lastSyncedAt &&
            new Date(r.lastSyncedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
      } else if (filter === "never") {
        filteredRepos = filteredRepos.filter((r: Repository) => !r.lastSyncedAt);
      }

      if (search) {
        filteredRepos = filteredRepos.filter(
          (r: Repository) =>
            r.repositoryName.toLowerCase().includes(search.toLowerCase()) ||
            r.repositoryUrl.toLowerCase().includes(search.toLowerCase()) ||
            r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.user?.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setRepositories(filteredRepos);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sync status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filter]);

  const getSyncStatus = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) {
      return {
        label: "Never Synced",
        variant: "destructive" as const,
        icon: <XCircle className="h-3 w-3 mr-1" />,
      };
    }
    const lastSync = new Date(lastSyncedAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return {
        label: "Synced",
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      };
    } else if (diffHours < 168) {
      return {
        label: "Needs Sync",
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    } else {
      return {
        label: "Outdated",
        variant: "destructive" as const,
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      };
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      const response = await fetch(`/api/admin/repositories/${id}/sync`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to sync repository");

      toast({
        title: "Success",
        description: "Repository synced successfully",
      });
      await fetchData();
    } catch (error) {
      console.error("Error syncing repository:", error);
      toast({
        title: "Error",
        description: "Failed to sync repository",
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      toast({
        title: "Info",
        description: "Sync process started for all repositories",
      });
      
      // Sync repositories that need it
      const reposToSync = repositories.filter(
        (r) => !r.lastSyncedAt || 
        new Date(r.lastSyncedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      for (const repo of reposToSync) {
        await handleSync(repo.id);
        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: "Success",
        description: "All repositories synced successfully",
      });
    } catch (error) {
      console.error("Error syncing all repositories:", error);
      toast({
        title: "Error",
        description: "Failed to sync all repositories",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/repositories")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Repository Sync Status</h1>
              <p className="text-muted-foreground mt-1">
                Monitor GitHub repository synchronization status
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleSyncAll}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync All
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
              <GitBranch className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.repositories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Private</CardTitle>
              <Lock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.total.private}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Public</CardTitle>
              <Globe className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.total.public}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <RefreshCw className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {stats.total.withWebhooks}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  / {stats.total.repositories}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Needs Sync</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {stats.total.needsSync}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            {repositories.length} repositories found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === "synced" ? "default" : "outline"}
                  onClick={() => setFilter("synced")}
                  size="sm"
                  className={filter === "synced" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Synced
                </Button>
                <Button
                  variant={filter === "needs-sync" ? "default" : "outline"}
                  onClick={() => setFilter("needs-sync")}
                  size="sm"
                  className={filter === "needs-sync" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Needs Sync
                </Button>
                <Button
                  variant={filter === "never" ? "default" : "outline"}
                  onClick={() => setFilter("never")}
                  size="sm"
                  className={filter === "never" ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Never Synced
                </Button>
              </div>
            </div>

            {/* Repositories Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <p className="mt-2 text-muted-foreground">
                          Loading repositories...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : repositories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <GitBranch className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No repositories found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    repositories.map((repo) => {
                      const status = getSyncStatus(repo.lastSyncedAt);
                      const isSyncing = syncing === repo.id;
                      
                      return (
                        <TableRow key={repo.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                                {repo.repositoryName}
                              </span>
                              <a
                                href={repo.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                              >
                                {repo.repositoryUrl}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {repo.project ? (
                              <div>
                                <span className="text-sm font-medium">
                                  {repo.project.name}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {repo.project.status}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No project
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {repo.user?.name || repo.user?.username || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {repo.user?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={status.variant}
                              className={status.className}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {repo.lastSyncedAt ? (
                              <span className="text-sm">
                                {format(new Date(repo.lastSyncedAt), "PPp", {
                                  locale: id,
                                })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Never
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {repo.webhookId ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {status.label !== "Synced" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(repo.id)}
                                disabled={isSyncing}
                              >
                                {isSyncing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Sync Now
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}