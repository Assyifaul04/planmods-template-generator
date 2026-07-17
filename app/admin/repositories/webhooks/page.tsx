// app/admin/repositories/webhooks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  RefreshCw,
  ArrowLeft,
  Webhook,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface WebhookRepository {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  webhookId: string | null;
  webhookSecret: string | null;
  private: boolean;
  project: {
    id: string;
    name: string;
  };
  user: {
    name: string | null;
    email: string;
  };
}

export default function WebhookManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get("repo");
  
  const [repositories, setRepositories] = useState<WebhookRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<WebhookRepository | null>(null);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [search]);

  useEffect(() => {
    if (repoId) {
      // Focus on the specific repository
      const repo = repositories.find(r => r.id === repoId);
      if (repo) {
        setSelectedRepo(repo);
        setShowEditDialog(true);
      }
    }
  }, [repoId, repositories]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/repositories?limit=100");
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;
    setSubmitting(true);

    try {
      // Generate a webhook ID and secret
      const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const secret = `whsec_${Math.random().toString(36).substr(2, 24)}`;

      const response = await fetch(`/api/admin/repositories/${selectedRepo.id}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId, webhookSecret: secret }),
      });

      if (!response.ok) throw new Error("Failed to create webhook");

      toast.success("Webhook created successfully");
      setShowCreateDialog(false);
      setSelectedRepo(null);
      fetchRepositories();
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast.error("Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/repositories/${selectedRepo.id}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          webhookId: selectedRepo.webhookId,
          webhookSecret: webhookSecret || selectedRepo.webhookSecret,
        }),
      });

      if (!response.ok) throw new Error("Failed to update webhook");

      toast.success("Webhook updated successfully");
      setShowEditDialog(false);
      setSelectedRepo(null);
      setWebhookSecret("");
      fetchRepositories();
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast.error("Failed to update webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedRepo) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/repositories/${selectedRepo.id}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId: null, webhookSecret: null }),
      });

      if (!response.ok) throw new Error("Failed to delete webhook");

      toast.success("Webhook deleted successfully");
      setShowDeleteDialog(false);
      setSelectedRepo(null);
      fetchRepositories();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Failed to delete webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
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
              <h2 className="text-2xl font-semibold text-white">Webhook Management</h2>
              <p className="text-sm text-white/60 mt-1">
                Configure GitHub webhooks for repository synchronization
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setSelectedRepo(null);
            setShowCreateDialog(true);
          }}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchRepositories}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Webhook Configuration Guide */}
      <Card className="bg-black/40 border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-400" />
            Webhook Configuration Guide
          </CardTitle>
          <CardDescription className="text-white/60">
            Follow these steps to configure GitHub webhooks for your repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-white/60 list-decimal pl-5">
            <li>Go to your GitHub repository settings</li>
            <li>Navigate to "Webhooks" section</li>
            <li>Click "Add webhook"</li>
            <li>Set Payload URL to: <code className="bg-white/10 px-2 py-1 rounded text-white">https://your-domain.com/api/webhooks/github</code></li>
            <li>Set Content type to: <code className="bg-white/10 px-2 py-1 rounded text-white">application/json</code></li>
            <li>Set Secret to the generated webhook secret</li>
            <li>Select events: "Just the push event" or "Let me select individual events"</li>
            <li>Click "Add webhook"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Repositories Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Repository</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Owner</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Webhook ID</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : repositories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  No repositories found
                </TableCell>
              </TableRow>
            ) : (
              repositories.map((repo) => (
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
                  <TableCell>{getWebhookStatus(repo.webhookId)}</TableCell>
                  <TableCell>
                    {repo.webhookId ? (
                      <code className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                        {repo.webhookId}
                      </code>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {repo.webhookId ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRepo(repo);
                              setWebhookSecret(repo.webhookSecret || "");
                              setShowEditDialog(true);
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRepo(repo);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRepo(repo);
                            setShowCreateDialog(true);
                          }}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Configure Webhook</DialogTitle>
            <DialogDescription className="text-white/60">
              Select a repository to configure webhook
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebhook}>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">Select Repository *</Label>
                <div className="mt-1.5 max-h-[200px] overflow-y-auto space-y-2">
                  {repositories
                    .filter(r => !r.webhookId)
                    .map((repo) => (
                      <div
                        key={repo.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRepo?.id === repo.id
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                        onClick={() => setSelectedRepo(repo)}
                      >
                        <div className="text-white font-medium">{repo.repositoryName}</div>
                        <div className="text-xs text-white/40">{repo.project.name}</div>
                      </div>
                    ))}
                </div>
                {repositories.filter(r => !r.webhookId).length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">All repositories already have webhooks configured</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedRepo(null);
                }}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedRepo || submitting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Webhook className="h-4 w-4 mr-2" />
                    Create Webhook
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription className="text-white/60">
              Update webhook configuration for {selectedRepo?.repositoryName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWebhook}>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">Webhook ID</Label>
                <div className="mt-1.5 p-2 bg-white/5 rounded border border-white/10 text-white/60 font-mono text-sm">
                  {selectedRepo?.webhookId}
                </div>
              </div>
              <div>
                <Label htmlFor="secret" className="text-white">Webhook Secret</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="secret"
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret || selectedRepo?.webhookSecret || ""}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Webhook secret"
                    className="bg-white/5 border-white/10 text-white flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSecret(!showSecret)}
                    className="border-white/10 text-white hover:bg-white/10"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopySecret(webhookSecret || selectedRepo?.webhookSecret || "")}
                    className="border-white/10 text-white hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedRepo(null);
                  setWebhookSecret("");
                }}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Webhook
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete the webhook for "{selectedRepo?.repositoryName}"?
              This will stop all GitHub synchronization events.
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
              onClick={handleDeleteWebhook}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Webhook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}