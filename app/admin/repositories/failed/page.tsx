// app/admin/repositories/failed/page.tsx
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Loader2,
  GitBranch,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface FailedRepository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  private: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export default function FailedSyncsPage() {
  const [repositories, setRepositories] = useState<FailedRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { toast } = useToast();

  const fetchFailedRepos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/repositories/failed?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch data");

      setRepositories(data.repositories);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching failed repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load failed repositories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedRepos();
  }, [pagination.page]);

  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      const response = await fetch(`/api/admin/repositories/${id}/sync`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to sync");

      toast({
        title: "Success",
        description: "Repository synced successfully",
      });
      fetchFailedRepos();
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Failed Syncs</h1>
        <p className="text-muted-foreground mt-1">
          Repositories that need attention or have never been synced
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repositories Needing Sync</CardTitle>
          <CardDescription>
            {pagination.total} repositories require synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : repositories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">All repositories are in sync!</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Synced</TableHead>
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
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={undefined} />
                              <AvatarFallback>
                                {repo.user.name?.[0] || repo.user.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {repo.user.name || repo.user.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {repo.user.email}
                              </span>
                            </div>
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
                          {repo.lastSyncedAt ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Outdated
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Never Synced
                            </Badge>
                          )}
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
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSync(repo.id)}
                            disabled={syncing === repo.id}
                          >
                            {syncing === repo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync Now
                              </>
                            )}
                          </Button>
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