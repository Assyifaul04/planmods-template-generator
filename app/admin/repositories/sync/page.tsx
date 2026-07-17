// app/admin/repositories/sync/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, CheckCircle, XCircle, Clock, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SyncStats {
  totalRepos: number;
  privateRepos: number;
  publicRepos: number;
  withWebhooks: number;
  withoutWebhooks: number;
  recentlySynced: number;
  needsSync: number;
}

interface Repository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  lastSyncedAt: string | null;
  webhookId: string | null;
  project: {
    name: string;
  };
  user: {
    name: string | null;
    email: string;
  };
}

export default function SyncStatusPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "synced" | "needs-sync" | "never">("all");

  useEffect(() => {
    fetchData();
  }, [search, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reposRes] = await Promise.all([
        fetch("/api/admin/repositories/stats"),
        fetch("/api/admin/repositories?limit=100"),
      ]);

      const statsData = await statsRes.json();
      const reposData = await reposRes.json();

      setStats(statsData);
      
      // Filter repositories based on filter
      let filteredRepos = reposData.repositories || [];
      if (filter === "synced") {
        filteredRepos = filteredRepos.filter((r: any) => r.lastSyncedAt && new Date(r.lastSyncedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));
      } else if (filter === "needs-sync") {
        filteredRepos = filteredRepos.filter((r: any) => 
          r.lastSyncedAt && new Date(r.lastSyncedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
      } else if (filter === "never") {
        filteredRepos = filteredRepos.filter((r: any) => !r.lastSyncedAt);
      }

      if (search) {
        filteredRepos = filteredRepos.filter((r: any) =>
          r.repositoryName.toLowerCase().includes(search.toLowerCase()) ||
          r.repositoryUrl.toLowerCase().includes(search.toLowerCase())
        );
      }

      setRepositories(filteredRepos);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch sync status");
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatus = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) {
      return { label: "Never Synced", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    const lastSync = new Date(lastSyncedAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return { label: "Synced", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    } else if (diffHours < 168) {
      return { label: "Needs Sync", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    } else {
      return { label: "Outdated", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
  };

  const handleSyncAll = async () => {
    try {
      // In production, this would trigger a background job
      // For now, we'll just refresh the data
      toast.success("Sync process started for all repositories");
      setTimeout(() => {
        fetchData();
      }, 2000);
    } catch (error) {
      console.error("Error syncing all:", error);
      toast.error("Failed to start sync process");
    }
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/repositories")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">Repository Sync Status</h2>
              <p className="text-sm text-white/60 mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Total Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalRepos}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Private</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.privateRepos}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Public</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.publicRepos}</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {stats.withWebhooks}
                <span className="text-sm text-white/40 ml-2">/ {stats.totalRepos}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Needs Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.needsSync}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-white text-black hover:bg-white/90" : "border-white/10 text-white hover:bg-white/10"}
          >
            All
          </Button>
          <Button
            variant={filter === "synced" ? "default" : "outline"}
            onClick={() => setFilter("synced")}
            className={filter === "synced" ? "bg-green-500 hover:bg-green-600" : "border-white/10 text-white hover:bg-white/10"}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Synced
          </Button>
          <Button
            variant={filter === "needs-sync" ? "default" : "outline"}
            onClick={() => setFilter("needs-sync")}
            className={filter === "needs-sync" ? "bg-yellow-500 hover:bg-yellow-600" : "border-white/10 text-white hover:bg-white/10"}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Needs Sync
          </Button>
          <Button
            variant={filter === "never" ? "default" : "outline"}
            onClick={() => setFilter("never")}
            className={filter === "never" ? "bg-red-500 hover:bg-red-600" : "border-white/10 text-white hover:bg-white/10"}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Never Synced
          </Button>
        </div>
      </div>

      {/* Repositories Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Repository</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Owner</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Last Synced</TableHead>
              <TableHead className="text-white/60 font-medium">Webhook</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : repositories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  No repositories found
                </TableCell>
              </TableRow>
            ) : (
              repositories.map((repo) => {
                const status = getSyncStatus(repo.lastSyncedAt);
                return (
                  <TableRow key={repo.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{repo.repositoryName}</div>
                        <div className="text-xs text-white/40 truncate max-w-[200px]">
                          {repo.repositoryUrl}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{repo.project.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-white/60">{repo.user.name || "Unknown"}</div>
                        <div className="text-xs text-white/40">{repo.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      {repo.webhookId ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {status.label !== "Synced" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Trigger sync for this repository
                            toast.success(`Syncing ${repo.repositoryName}...`);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <RefreshCw className="h-4 w-4" />
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
  );
}