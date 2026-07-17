// app/admin/builds/failed/page.tsx
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
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Play,
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface FailedBuild {
  id: string;
  status: "FAILED" | "CANCELLED";
  logs: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    platform: string;
    loader: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  triggeredBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

export default function FailedBuildsPage() {
  const router = useRouter();
  const [builds, setBuilds] = useState<FailedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBuild, setSelectedBuild] = useState<FailedBuild | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchFailedBuilds();
  }, [search, page]);

  const fetchFailedBuilds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        status: "FAILED",
      });
      
      const response = await fetch(`/api/admin/builds?${params}`);
      const data = await response.json();
      setBuilds(data.builds);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching failed builds:", error);
      toast.error("Failed to fetch failed builds");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryBuild = async (buildId: string) => {
    setRetrying(true);
    try {
      const response = await fetch(`/api/admin/builds/${buildId}/retry`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to retry build");

      toast.success("Build retry initiated");
      fetchFailedBuilds();
      setShowRetryDialog(false);
    } catch (error) {
      console.error("Error retrying build:", error);
      toast.error("Failed to retry build");
    } finally {
      setRetrying(false);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
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

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/builds")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">Failed Builds</h2>
              <p className="text-sm text-white/60 mt-1">
                Review and retry failed build processes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <XCircle className="h-4 w-4 text-red-400" />
            Failed Builds
          </div>
          <div className="text-2xl font-bold text-white">{builds.length}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            Avg Duration
          </div>
          <div className="text-2xl font-bold text-white">
            {builds.length > 0
              ? formatDuration(
                  builds.reduce((acc, b) => acc + (b.durationMs || 0), 0) / builds.length
                )
              : "-"}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Play className="h-4 w-4 text-blue-400" />
            Retry Available
          </div>
          <div className="text-2xl font-bold text-white">
            {builds.filter(b => b.status === "FAILED").length}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search failed builds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchFailedBuilds}
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
              <TableHead className="text-white/60 font-medium">Build ID</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Triggered By</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Duration</TableHead>
              <TableHead className="text-white/60 font-medium">Error</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading failed builds...
                  </div>
                </TableCell>
              </TableRow>
            ) : builds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                    <p>No failed builds found</p>
                    <p className="text-sm text-white/30">All builds are successful!</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              builds.map((build) => (
                <TableRow key={build.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <code className="text-xs text-white/60 font-mono">{build.id.slice(0, 8)}</code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-white font-medium">{build.project.name}</div>
                      <div className="text-xs text-white/40">
                        {build.project.platform} · {build.project.loader}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                        {getInitials(build.triggeredBy?.name)}
                      </div>
                      <div>
                        <div className="text-white text-sm">{build.triggeredBy?.name || "System"}</div>
                        <div className="text-xs text-white/40">{build.triggeredBy?.email || "Auto"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {formatDuration(build.durationMs)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-red-400/80 text-sm">
                      {build.errorMessage || "Unknown error"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBuild(build);
                          setShowLogsDialog(true);
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBuild(build);
                          setShowRetryDialog(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Play className="h-4 w-4" />
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

      {/* View Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Build Logs - Failed Build</DialogTitle>
            <DialogDescription className="text-white/60">
              Build {selectedBuild?.id.slice(0, 8)} for {selectedBuild?.project.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-black/80 border border-white/10 p-4 overflow-auto max-h-[400px]">
              <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono">
                {selectedBuild?.logs || "No logs available"}
              </pre>
              {selectedBuild?.errorMessage && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-medium">Error:</p>
                  <p className="text-sm text-red-300/80">{selectedBuild.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowLogsDialog(false)}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry Dialog */}
      <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Retry Failed Build</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to retry the failed build for "{selectedBuild?.project.name}"?
              This will create a new build with the same configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRetryDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRetryBuild(selectedBuild?.id!)}
              disabled={retrying}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {retrying ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Retrying...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Retry Build
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}