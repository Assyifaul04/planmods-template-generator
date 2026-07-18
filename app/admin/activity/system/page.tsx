// app/admin/activity/system/page.tsx
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
  ArrowLeft,
  Server,
  Activity,
  Calendar,
  Clock,
  Eye,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface SystemActivity {
  id: string;
  action: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    role: string;
  };
}

export default function SystemActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [systemActionSummary, setSystemActionSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<SystemActivity | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchSystemActivities();
  }, [search, page]);

  const fetchSystemActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      
      const response = await fetch(`/api/admin/activity/system?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch system activities");
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
      setSystemActionSummary(data.systemActionSummary || []);
      
      // Handle pagination safely
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching system activities:", error);
      toast.error("Failed to fetch system activities");
      setActivities([]);
      setSystemActionSummary([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("SETTINGS") || action.includes("CONFIG")) {
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
    if (action.includes("TEMPLATE") || action.includes("TAG")) {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    }
    if (action.includes("USER") || action.includes("ROLE")) {
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }
    if (action.includes("PROJECT") || action.includes("BUILD")) {
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
    if (action.includes("API_KEY") || action.includes("WEBHOOK")) {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
    if (action.includes("REPOSITORY") || action.includes("SYNC")) {
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    }
    if (action.includes("SECURITY") || action.includes("MAINTENANCE")) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
              onClick={() => router.push("/admin/activity")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">System Activities</h2>
              <p className="text-sm text-white/60 mt-1">
                Monitor all system-level administrative actions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Action Summary */}
      {systemActionSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="text-sm text-white/40">Total System Actions</div>
            <div className="text-2xl font-bold text-white">
              {systemActionSummary.reduce((acc, item) => acc + (item._count || 0), 0)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="text-sm text-white/40">Most Common Action</div>
            <div className="text-lg font-bold text-white truncate">
              {systemActionSummary[0]?.action ? formatAction(systemActionSummary[0].action) : "N/A"}
            </div>
            <div className="text-xs text-white/40">
              {systemActionSummary[0]?._count || 0} occurrences
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="text-sm text-white/40">Unique Actions</div>
            <div className="text-2xl font-bold text-white">{systemActionSummary.length}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="text-sm text-white/40">Admin Users</div>
            <div className="text-2xl font-bold text-purple-400">
              {new Set(activities.map(a => a.user.id)).size}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search system activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchSystemActivities}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Activities Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Action</TableHead>
              <TableHead className="text-white/60 font-medium">Admin</TableHead>
              <TableHead className="text-white/60 font-medium">Category</TableHead>
              <TableHead className="text-white/60 font-medium">Details</TableHead>
              <TableHead className="text-white/60 font-medium">Time</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading system activities...
                  </div>
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Server className="h-12 w-12 text-white/20" />
                    <p>No system activities found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => {
                // Determine category
                let category = "Other";
                let categoryColor = "bg-gray-500/20 text-gray-400 border-gray-500/30";
                if (activity.action.includes("SETTINGS")) {
                  category = "Settings";
                  categoryColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                } else if (activity.action.includes("TEMPLATE") || activity.action.includes("TAG")) {
                  category = "Templates";
                  categoryColor = "bg-green-500/20 text-green-400 border-green-500/30";
                } else if (activity.action.includes("USER") || activity.action.includes("ROLE")) {
                  category = "Users";
                  categoryColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
                } else if (activity.action.includes("PROJECT") || activity.action.includes("BUILD")) {
                  category = "Projects";
                  categoryColor = "bg-orange-500/20 text-orange-400 border-orange-500/30";
                } else if (activity.action.includes("API_KEY") || activity.action.includes("WEBHOOK")) {
                  category = "API";
                  categoryColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
                } else if (activity.action.includes("REPOSITORY") || activity.action.includes("SYNC")) {
                  category = "GitHub";
                  categoryColor = "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
                } else if (activity.action.includes("SECURITY") || activity.action.includes("MAINTENANCE")) {
                  category = "Security";
                  categoryColor = "bg-red-500/20 text-red-400 border-red-500/30";
                }

                return (
                  <TableRow key={activity.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <Badge className={getActionColor(activity.action)}>
                        {formatAction(activity.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                          {getInitials(activity.user.name)}
                        </div>
                        <div>
                          <div className="text-white text-sm">{activity.user.name || "Unknown"}</div>
                          <div className="text-xs text-white/40">{activity.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColor}>{category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate text-white/60 text-sm">
                        {activity.metadata ? (
                          <span className="text-xs">
                            {Object.keys(activity.metadata).join(", ")}
                          </span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {formatDate(activity.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowDetailsDialog(true);
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Activity Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>System Activity Details</DialogTitle>
            <DialogDescription className="text-white/60">
              Detailed information about this system activity
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/40">Action</p>
                <Badge className={getActionColor(selectedActivity?.action || "")}>
                  {formatAction(selectedActivity?.action || "")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-white/40">Admin</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                    {getInitials(selectedActivity?.user.name || null)}
                  </div>
                  <div>
                    <div className="text-white">{selectedActivity?.user.name || "Unknown"}</div>
                    <div className="text-xs text-white/40">{selectedActivity?.user.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-white/40">Timestamp</p>
              <p className="text-white/60">{formatDate(selectedActivity?.createdAt || "")}</p>
            </div>

            {selectedActivity?.metadata && (
              <div>
                <p className="text-sm text-white/40">Metadata</p>
                <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <pre className="text-xs text-white/60 whitespace-pre-wrap">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowDetailsDialog(false)}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}