// app/admin/builds/page.tsx
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
  Server,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Square,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Build {
  id: string;
  status: "PENDING" | "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
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

export default function BuildsPage() {
  const router = useRouter();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, [search, page, statusFilter]);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(statusFilter && { status: statusFilter }),
      });
      
      const response = await fetch(`/api/admin/builds?${params}`);
      const data = await response.json();
      setBuilds(data.builds);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching builds:", error);
      toast.error("Failed to fetch builds");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBuild = async (buildId: string) => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/admin/builds/${buildId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel build");

      toast.success("Build cancelled successfully");
      fetchBuilds();
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error cancelling build:", error);
      toast.error("Failed to cancel build");
    } finally {
      setCancelling(false);
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
      fetchBuilds();
      setShowRetryDialog(false);
    } catch (error) {
      console.error("Error retrying build:", error);
      toast.error("Failed to retry build");
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { label: "Pending", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Clock },
      QUEUED: { label: "Queued", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      RUNNING: { label: "Running", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Loader2 },
      SUCCESS: { label: "Success", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
      FAILED: { label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
      CANCELLED: { label: "Cancelled", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Square },
    };
    const info = statusMap[status] || statusMap.PENDING;
    const Icon = info.icon;
    return (
      <Badge className={info.className}>
        <Icon className={`h-3 w-3 mr-1 ${status === "RUNNING" ? "animate-spin" : ""}`} />
        {info.label}
      </Badge>
    );
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
          <h2 className="text-2xl font-semibold text-white">Build History</h2>
          <p className="text-sm text-white/60 mt-1">
            Monitor and manage all build processes
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/builds/statistics")}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <Server className="h-4 w-4 mr-2" />
          Statistics
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search builds by project or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchBuilds}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Builds Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Build ID</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Triggered By</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Duration</TableHead>
              <TableHead className="text-white/60 font-medium">Started</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading builds...
                  </div>
                </TableCell>
              </TableRow>
            ) : builds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Server className="h-12 w-12 text-white/20" />
                    <p>No builds found</p>
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
                  <TableCell>{getStatusBadge(build.status)}</TableCell>
                  <TableCell className="text-white/60">
                    {formatDuration(build.durationMs)}
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {build.startedAt ? new Date(build.startedAt).toLocaleString() : "-"}
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
                          onClick={() => {
                            setSelectedBuild(build);
                            setShowLogsDialog(true);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/builds/${build.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Server className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {(build.status === "PENDING" || build.status === "QUEUED" || build.status === "RUNNING") && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBuild(build);
                              setShowCancelDialog(true);
                            }}
                            className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Cancel Build
                          </DropdownMenuItem>
                        )}
                        {(build.status === "FAILED" || build.status === "CANCELLED") && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBuild(build);
                              setShowRetryDialog(true);
                            }}
                            className="hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 cursor-pointer"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Retry Build
                          </DropdownMenuItem>
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

      {/* View Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Build Logs</DialogTitle>
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

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Cancel Build</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to cancel the build for "{selectedBuild?.project.name}"?
              This will stop the current build process.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCancelBuild(selectedBuild?.id!)}
              disabled={cancelling}
              className="bg-red-500 hover:bg-red-600"
            >
              {cancelling ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Cancel Build
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry Dialog */}
      <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Retry Build</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to retry the build for "{selectedBuild?.project.name}"?
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