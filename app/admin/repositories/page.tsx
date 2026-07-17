// app/admin/repositories/page.tsx
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  Eye,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Globe,
  Lock,
  Webhook,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Repository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  private: boolean;
  webhookId: string | null;
  webhookSecret: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
    visibility: string;
  };
}

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function RepositoriesPage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [privateFilter, setPrivateFilter] = useState<string>("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [search, page, privateFilter]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(privateFilter && { private: privateFilter }),
      });
      
      const response = await fetch(`/api/admin/repositories?${params}`);
      const data = await response.json();
      setRepositories(data.repositories);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRepository = async (repoId: string) => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/repositories/${repoId}/sync`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to sync repository");

      toast.success("Repository synced successfully");
      fetchRepositories();
      setShowSyncDialog(false);
    } catch (error) {
      console.error("Error syncing repository:", error);
      toast.error("Failed to sync repository");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteRepository = async (repoId: string) => {
    try {
      const response = await fetch(`/api/admin/repositories/${repoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete repository");

      toast.success("Repository deleted successfully");
      fetchRepositories();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting repository:", error);
      toast.error("Failed to delete repository");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSyncStatus = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Never Synced</Badge>;
    }
    const lastSync = new Date(lastSyncedAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Synced</Badge>;
    } else if (diffHours < 168) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Needs Sync</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Outdated</Badge>;
    }
  };

  const getWebhookStatus = (webhookId: string | null) => {
    if (webhookId) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Configured</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Not Configured</Badge>;
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">GitHub Repositories</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all GitHub repositories connected to projects
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/repositories/sync")}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Status
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search repositories by name, URL, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={privateFilter} onValueChange={setPrivateFilter}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Repositories" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Repositories</SelectItem>
            <SelectItem value="true">Private</SelectItem>
            <SelectItem value="false">Public</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchRepositories}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Repositories Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Repository</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Owner</TableHead>
              <TableHead className="text-white/60 font-medium">Visibility</TableHead>
              <TableHead className="text-white/60 font-medium">Webhook</TableHead>
              <TableHead className="text-white/60 font-medium">Sync Status</TableHead>
              <TableHead className="text-white/60 font-medium">Added</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading repositories...
                  </div>
                </TableCell>
              </TableRow>
            ) : repositories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <GitBranch className="h-12 w-12 text-white/20" />
                    <p>No repositories found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              repositories.map((repo) => (
                <TableRow key={repo.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <GithubIcon className="h-4 w-4 text-white/40" />
                        <span className="text-white font-medium">{repo.repositoryName}</span>
                      </div>
                      <div className="text-xs text-white/40 truncate max-w-[200px]">
                        {repo.repositoryUrl}
                      </div>
                      <div className="text-xs text-white/30">Branch: {repo.defaultBranch}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                      onClick={() => router.push(`/admin/projects/${repo.project.id}`)}
                    >
                      {repo.project.name}
                    </Button>
                    <div className="text-xs text-white/30">{repo.project.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                        {getInitials(repo.user.name)}
                      </div>
                      <div>
                        <div className="text-white text-sm">{repo.user.name || "Unknown"}</div>
                        <div className="text-xs text-white/40">{repo.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {repo.private ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getWebhookStatus(repo.webhookId)}</TableCell>
                  <TableCell>{getSyncStatus(repo.lastSyncedAt)}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(repo.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black border-white/10 text-white">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/repositories/${repo.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo(repo);
                            setShowSyncDialog(true);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/repositories/webhooks?repo=${repo.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Webhook className="h-4 w-4 mr-2" />
                          Manage Webhook
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo(repo);
                            setShowDeleteDialog(true);
                          }}
                          className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-white/40">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Sync Repository</DialogTitle>
            <DialogDescription className="text-white/60">
              Sync "{selectedRepo?.repositoryName}" with GitHub
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSyncRepository(selectedRepo?.id!)}
              disabled={syncing}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {syncing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Repository</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedRepo?.repositoryName}"? This will also remove the GitHub repository connection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteRepository(selectedRepo?.id!)}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Repository
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}