// app/admin/repositories/webhooks/page.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Webhook,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  GitBranch,
} from "lucide-react";

interface WebhookRepository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  webhookId: string | null;
  webhookSecret: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
    visibility: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
}

export default function WebhookManagementPage() {
  const [repositories, setRepositories] = useState<WebhookRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`/api/admin/repositories/webhooks?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch webhooks");

      setRepositories(data.webhooks || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [pagination.page, pagination.limit, filterStatus]);

  const handleWebhookAction = async (id: string, action: "create" | "update" | "delete") => {
    try {
      setProcessing(id);
      const response = await fetch(`/api/admin/repositories/${id}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `Failed to ${action} webhook`);

      toast({
        title: "Success",
        description: `Webhook ${action}ed successfully`,
      });
      fetchWebhooks();
    } catch (error) {
      console.error(`Error ${action}ing webhook:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} webhook`,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage GitHub webhooks for repository synchronization
          </p>
        </div>
        <Button onClick={fetchWebhooks} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                {pagination.total} repositories with webhook configuration
              </CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : repositories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Webhook className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No webhook configurations found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Webhook ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repo) => (
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
                              <span className="text-sm">{repo.project.name}</span>
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
                              {repo.user?.name || repo.user?.username || repo.user?.email || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {repo.user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {repo.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {repo.webhookId ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {repo.webhookId}
                            </code>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not configured
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!repo.isActive ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleWebhookAction(repo.id, "create")
                                }
                                disabled={processing === repo.id}
                              >
                                {processing === repo.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create
                                  </>
                                )}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleWebhookAction(repo.id, "update")
                                  }
                                  disabled={processing === repo.id}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleWebhookAction(repo.id, "delete")
                                  }
                                  disabled={processing === repo.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}