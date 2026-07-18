// app/admin/versions/page.tsx
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
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Package,
  Box,
  Star,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface LoaderVersion {
  id: string;
  loader: string;
  loaderVersion: string;
  recommended: boolean;
  supported: boolean;
  templates: Array<{ id: string; name: string }>;
}

interface MinecraftVersion {
  id: string;
  version: string;
  platform: "JAVA" | "BEDROCK";
  isLatest: boolean;
  isSnapshot: boolean;
  releaseDate: string | null;
  createdAt: string;
  loaderVersions: LoaderVersion[];
  _count: {
    projects: number;
    templates: number;
    loaderVersions: number;
  };
}

export default function VersionsPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState<MinecraftVersion | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchVersions();
  }, [search, page, platformFilter, statusFilter]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(platformFilter && { platform: platformFilter }),
        ...(statusFilter && { isLatest: statusFilter === "latest" ? "true" : statusFilter === "snapshot" ? "true" : "" }),
        ...(statusFilter === "snapshot" && { isSnapshot: "true" }),
      });
      
      const response = await fetch(`/api/admin/versions?${params}`);
      const data = await response.json();
      setVersions(data.versions);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/versions/${versionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete version");
      }

      toast.success("Version deleted successfully");
      fetchVersions();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete version");
    }
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === "JAVA") {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Java</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bedrock</Badge>;
  };

  const getStatusBadge = (isLatest: boolean, isSnapshot: boolean) => {
    if (isLatest) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Latest</Badge>;
    }
    if (isSnapshot) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Snapshot</Badge>;
    }
    return <Badge variant="outline" className="text-white/40">Stable</Badge>;
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Minecraft Versions</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage Minecraft versions and their loader configurations
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/versions/new")}
          className="bg-white text-black hover:bg-white/90"
        >
          <Layers className="h-4 w-4 mr-2" />
          Add Version
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search versions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Platforms</SelectItem>
            <SelectItem value="JAVA">Java</SelectItem>
            <SelectItem value="BEDROCK">Bedrock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="snapshot">Snapshot</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchVersions}
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
              <TableHead className="text-white/60 font-medium">Version</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Loaders</TableHead>
              <TableHead className="text-white/60 font-medium">Projects</TableHead>
              <TableHead className="text-white/60 font-medium">Templates</TableHead>
              <TableHead className="text-white/60 font-medium">Released</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading versions...
                  </div>
                </TableCell>
              </TableRow>
            ) : versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="h-12 w-12 text-white/20" />
                    <p>No versions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <TableRow key={version.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-white/30" />
                      <span className="text-white font-medium">{version.version}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPlatformBadge(version.platform)}</TableCell>
                  <TableCell>{getStatusBadge(version.isLatest, version.isSnapshot)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {version.loaderVersions.slice(0, 3).map((lv) => (
                        <Badge key={lv.id} variant="outline" className="text-white/40 border-white/10 text-[10px]">
                          {lv.loader}
                          {lv.recommended && (
                            <Star className="h-2.5 w-2.5 ml-1 fill-yellow-400 text-yellow-400" />
                          )}
                        </Badge>
                      ))}
                      {version.loaderVersions.length > 3 && (
                        <Badge variant="outline" className="text-white/40 border-white/10 text-[10px]">
                          +{version.loaderVersions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">{version._count.projects}</TableCell>
                  <TableCell className="text-white/60">{version._count.templates}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {version.releaseDate ? new Date(version.releaseDate).toLocaleDateString() : "-"}
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
                          onClick={() => router.push(`/admin/versions/${version.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/versions/${version.id}/edit`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/versions/${version.id}/loaders`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Box className="h-4 w-4 mr-2" />
                          Manage Loaders
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVersion(version);
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

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-white/40">Page {page} of {totalPages}</div>
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Version</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedVersion?.version}"?
              {selectedVersion && (selectedVersion._count.projects > 0 || selectedVersion._count.templates > 0) && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This version is used by {selectedVersion._count.projects} projects and {selectedVersion._count.templates} templates.
                  You cannot delete it until these are removed.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteVersion(selectedVersion?.id!)}
              className="bg-red-500 hover:bg-red-600"
              disabled={selectedVersion?._count.projects! > 0 || selectedVersion?._count.templates! > 0}
            >
              Delete Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}