// app/admin/api-keys/revoked/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Key,
  Ban,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface RevokedKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  revokedAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function RevokedKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<RevokedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedKey, setSelectedKey] = useState<RevokedKey | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRevokedKeys();
  }, [search, page]);

  const fetchRevokedKeys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        revoked: "true",
      });
      
      const response = await fetch(`/api/admin/api-keys?${params}`);
      const data = await response.json();
      setApiKeys(data.apiKeys);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching revoked keys:", error);
      toast.error("Failed to fetch revoked keys");
    } finally {
      setLoading(false);
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
      fetchRevokedKeys();
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
      fetchRevokedKeys();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    } finally {
      setProcessing(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/api-keys")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">Revoked API Keys</h2>
              <p className="text-sm text-white/60 mt-1">
                Manage revoked API keys and restore if needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Ban className="h-4 w-4 text-red-400" />
            Revoked Keys
          </div>
          <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Clock className="h-4 w-4 text-blue-400" />
            Total Unique Users
          </div>
          <div className="text-2xl font-bold text-white">
            {new Set(apiKeys.map(k => k.user.id)).size}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Key className="h-4 w-4 text-green-400" />
            Restorable Keys
          </div>
          <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search revoked keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchRevokedKeys}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Key</TableHead>
              <TableHead className="text-white/60 font-medium">User</TableHead>
              <TableHead className="text-white/60 font-medium">Scopes</TableHead>
              <TableHead className="text-white/60 font-medium">Revoked At</TableHead>
              <TableHead className="text-white/60 font-medium">Created</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading revoked keys...
                  </div>
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                    <p>No revoked API keys found</p>
                    <p className="text-sm text-white/30">All keys are active</p>
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
                        key.scopes.slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="outline" className="text-white/40 border-white/10 text-[10px]">
                            {scope}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-white/30 text-sm">-</span>
                      )}
                      {key.scopes.length > 2 && (
                        <Badge variant="outline" className="text-white/40 border-white/10 text-[10px]">
                          +{key.scopes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {formatDate(key.revokedAt)}
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {formatDate(key.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedKey(key);
                          setShowRestoreDialog(true);
                        }}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedKey(key);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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