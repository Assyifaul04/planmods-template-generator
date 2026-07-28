// app/admin/repositories/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  GitBranch,
  RefreshCw,
  MoreVertical,
  Eye,
  Globe,
  Lock,
  ExternalLink,
  Loader2,
  Clock,
  Webhook,
  Trash2,
  Database,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPrivate, setFilterPrivate] = useState<string>("all");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      if (filterPrivate !== "all") params.append("private", filterPrivate);

      const response = await fetch(`/api/admin/repositories?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch repositories");

      setRepositories(data.repositories);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [pagination.page, pagination.limit, search, filterPrivate]);

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
      fetchRepositories();
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/repositories/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to delete repository");

      toast({
        title: "Success",
        description: "Repository deleted successfully",
      });
      setShowDeleteDialog(false);
      fetchRepositories();
    } catch (error) {
      console.error("Error deleting repository:", error);
      toast({
        title: "Error",
        description: "Failed to delete repository",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (repository: Repository) => {
    if (!repository.lastSyncedAt) {
      return <Badge variant="destructive">Never Synced</Badge>;
    }
    const daysSinceSync = Math.floor(
      (Date.now() - new Date(repository.lastSyncedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceSync > 7) {
      return <Badge variant="destructive">Needs Sync</Badge>;
    }
    if (daysSinceSync > 1) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Stale</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Synced</Badge>;
  };

  const getWebhookStatus = (repository: Repository) => {
    if (repository.webhookId) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Repositories</h1>
          <p className="text-muted-foreground mt-1">
            Manage GitHub repositories connected to projects
          </p>
        </div>
        <Button onClick={() => router.push("/admin/repositories/stats")}>
          <Database className="h-4 w-4 mr-2" />
          View Stats
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Total {pagination.total} repositories found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterPrivate} onValueChange={setFilterPrivate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Private</SelectItem>
                  <SelectItem value="false">Public</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchRepositories}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                    repositories.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                              {repo.repositoryName}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <a
                                href={repo.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary flex items-center gap-1"
                              >
                                {repo.repositoryUrl}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={repo.user.image || undefined} />
                              <AvatarFallback>
                                {repo.user.name?.[0] || repo.user.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {repo.user.name || repo.user.username}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {repo.user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {repo.project ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {repo.project.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {repo.project.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No project
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {repo.private ? (
                            <Badge variant="destructive">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(repo)}
                            {repo.lastSyncedAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(repo.lastSyncedAt), "PPp", {
                                  locale: id,
                                })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getWebhookStatus(repo)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRepo(repo);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSync(repo.id)}
                                disabled={syncing === repo.id}
                              >
                                {syncing === repo.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Sync Now
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/admin/repositories/webhooks?repo=${repo.id}`
                                  )
                                }
                              >
                                <Webhook className="h-4 w-4 mr-2" />
                                Manage Webhook
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedRepo(repo);
                                  setShowDeleteDialog(true);
                                }}
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {repositories.length} of {pagination.total} repositories
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(prev.page - 1, 1),
                    }))
                  }
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.page + 1, prev.totalPages),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Repository Details</DialogTitle>
            <DialogDescription>
              Complete information about the repository
            </DialogDescription>
          </DialogHeader>
          {selectedRepo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Repository Name
                  </h4>
                  <p className="font-medium">{selectedRepo.repositoryName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Default Branch
                  </h4>
                  <p>{selectedRepo.defaultBranch}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Visibility
                  </h4>
                  <Badge variant={selectedRepo.private ? "destructive" : "default"}>
                    {selectedRepo.private ? "Private" : "Public"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Webhook Status
                  </h4>
                  {selectedRepo.webhookId ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Repository URL
                  </h4>
                  <a
                    href={selectedRepo.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedRepo.repositoryUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Clone URL
                  </h4>
                  <p className="font-mono text-sm">{selectedRepo.cloneUrl}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Created At
                  </h4>
                  <p>{format(new Date(selectedRepo.createdAt), "PPp", { locale: id })}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Last Synced
                  </h4>
                  {selectedRepo.lastSyncedAt ? (
                    <p>
                      {format(new Date(selectedRepo.lastSyncedAt), "PPp", {
                        locale: id,
                      })}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Never synced</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Associated Project</h4>
                {selectedRepo.project ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Project Name
                      </h4>
                      <p>{selectedRepo.project.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Status
                      </h4>
                      <Badge>{selectedRepo.project.status}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not associated with any project</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">User Information</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedRepo.user.image || undefined} />
                    <AvatarFallback>
                      {selectedRepo.user.name?.[0] || selectedRepo.user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedRepo.user.name || selectedRepo.user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRepo.user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {selectedRepo && (
              <Button
                onClick={() => {
                  setShowDetailDialog(false);
                  handleSync(selectedRepo.id);
                }}
                disabled={syncing === selectedRepo.id}
              >
                {syncing === selectedRepo.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Repository</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this repository? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRepo && (
            <div className="py-4">
              <p className="font-medium">Repository: {selectedRepo.repositoryName}</p>
              <p className="text-sm text-muted-foreground">{selectedRepo.repositoryUrl}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRepo && handleDelete(selectedRepo.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}