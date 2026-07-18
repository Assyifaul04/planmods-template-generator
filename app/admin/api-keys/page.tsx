// app/admin/api-keys/page.tsx
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
  ChevronLeft,
  ChevronRight,
  Key,
  Ban,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [revokedFilter, setRevokedFilter] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, [search, page, revokedFilter]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(revokedFilter && { revoked: revokedFilter }),
      });
      
      const response = await fetch(`/api/admin/api-keys?${params}`);
      const data = await response.json();
      setApiKeys(data.apiKeys);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/revoke`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to revoke API key");

      toast.success("API key revoked successfully");
      fetchApiKeys();
      setShowRevokeDialog(false);
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreKey = async (keyId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/restore`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to restore API key");

      toast.success("API key restored successfully");
      fetchApiKeys();
      setShowRestoreDialog(false);
    } catch (error) {
      console.error("Error restoring API key:", error);
      toast.error("Failed to restore API key");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete API key");

      toast.success("API key deleted successfully");
      fetchApiKeys();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (apiKey.revokedAt) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Revoked</Badge>;
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Expired</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">API Keys Management</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all API keys across the platform
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/api-keys/statistics")}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <Key className="h-4 w-4 mr-2" />
          Statistics
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search API keys by name, prefix, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={revokedFilter} onValueChange={setRevokedFilter}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Keys" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Keys</SelectItem>
            <SelectItem value="false">Active Only</SelectItem>
            <SelectItem value="true">Revoked Only</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchApiKeys}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* API Keys Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Key</TableHead>
              <TableHead className="text-white/60 font-medium">User</TableHead>
              <TableHead className="text-white/60 font-medium">Scopes</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Last Used</TableHead>
              <TableHead className="text-white/60 font-medium">Created</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading API keys...
                  </div>
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Key className="h-12 w-12 text-white/20" />
                    <p>No API keys found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((key) => (
                <TableRow key={key.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-white/40" />
                        <span className="text-white font-medium">{key.name}</span>
                      </div>
                      <code className="text-xs text-white/40 font-mono">
                        {key.keyPrefix}...
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                        {getInitials(key.user.name)}
                      </div>
                      <div>
                        <div className="text-white text-sm">{key.user.name || "Unknown"}</div>
                        <div className="text-xs text-white/40">{key.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.length > 0 ? (
                        key.scopes.slice(0, 3).map((scope) => (
                          <Badge key={scope} variant="outline" className="text-white/40 border-white/10 text-[10px]">
                            {scope}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-white/30 text-sm">-</span>
                      )}
                      {key.scopes.length > 3 && (
                        <Badge variant="outline" className="text-white/40 border-white/10 text-[10px]">
                          +{key.scopes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(key)}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {formatDate(key.lastUsedAt)}
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {formatDate(key.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black border-white/10 text-white">
                        {!key.revokedAt ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedKey(key);
                                setShowRevokeDialog(true);
                              }}
                              className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedKey(key);
                                setShowDeleteDialog(true);
                              }}
                              className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedKey(key);
                                setShowRestoreDialog(true);
                              }}
                              className="hover:bg-green-500/10 text-green-400 hover:text-green-300 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedKey(key);
                                setShowDeleteDialog(true);
                              }}
                              className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}
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

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to revoke the API key "{selectedKey?.name}"?
              This will immediately invalidate the key and prevent any further API calls.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRevokeKey(selectedKey?.id!)}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Revoking...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Revoke Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Restore API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to restore the API key "{selectedKey?.name}"?
              This will reactivate the key and allow API calls again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRestoreKey(selectedKey?.id!)}
              disabled={processing}
              className="bg-green-500 hover:bg-green-600"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Key
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
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to permanently delete the API key "{selectedKey?.name}"?
              This action cannot be undone.
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
              onClick={() => handleDeleteKey(selectedKey?.id!)}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}