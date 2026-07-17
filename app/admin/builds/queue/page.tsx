// app/admin/builds/queue/page.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Square, Play, Clock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface QueuedBuild {
  id: string;
  status: "PENDING" | "QUEUED";
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

export default function BuildQueuePage() {
  const router = useRouter();
  const [builds, setBuilds] = useState<QueuedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState<QueuedBuild | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch("/api/admin/builds?status=PENDING,QUEUED&limit=100");
      const data = await response.json();
      setBuilds(data.builds || []);
    } catch (error) {
      console.error("Error fetching queue:", error);
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
      fetchQueue();
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error cancelling build:", error);
      toast.error("Failed to cancel build");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "PENDING") {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Pending</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Queued</Badge>;
  };

  const getQueuePosition = (index: number) => {
    if (index === 0) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Next</Badge>;
    if (index < 3) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">#{index + 1}</Badge>;
    return <span className="text-white/40">#{index + 1}</span>;
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
              <h2 className="text-2xl font-semibold text-white">Build Queue</h2>
              <p className="text-sm text-white/60 mt-1">
                Monitor and manage queued builds
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/60">
            <Clock className="h-4 w-4" />
            <span>{builds.length} builds in queue</span>
          </div>
          <Button
            variant="outline"
            onClick={fetchQueue}
            className="border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Position</TableHead>
              <TableHead className="text-white/60 font-medium">Build ID</TableHead>
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Triggered By</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Queued At</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading queue...
                  </div>
                </TableCell>
              </TableRow>
            ) : builds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                    <p>Queue is empty</p>
                    <p className="text-sm text-white/30">No builds are currently waiting</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              builds.map((build, index) => (
                <TableRow key={build.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>{getQueuePosition(index)}</TableCell>
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
                  <TableCell className="text-white/40 text-sm">
                    {new Date(build.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBuild(build);
                        setShowCancelDialog(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Cancel Build</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to cancel the build for "{selectedBuild?.project.name}"?
              This will remove it from the queue.
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
    </div>
  );
}