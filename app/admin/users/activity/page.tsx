// app/admin/users/activity/page.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Activity,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
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
  };
}

export default function UserActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetchActivities();
  }, [search, page, actionFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(actionFilter && { action: actionFilter }),
      });
      
      const response = await fetch(`/api/admin/users/activity?${params}`);
      const data = await response.json();
      setActivities(data.activities);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("CREATED")) {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    }
    if (action.includes("UPDATE") || action.includes("UPDATED")) {
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
    if (action.includes("DELETE") || action.includes("DELETED")) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
    if (action.includes("BANNED") || action.includes("UNBANNED")) {
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
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/users")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">User Activity Logs</h2>
          <p className="text-sm text-white/60 mt-1">
            Monitor all user activities and actions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Actions</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="UPDATED">Updated</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
            <SelectItem value="UNBANNED">Unbanned</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchActivities}
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
              <TableHead className="text-white/60">Action</TableHead>
              <TableHead className="text-white/60">User</TableHead>
              <TableHead className="text-white/60">Details</TableHead>
              <TableHead className="text-white/60">IP</TableHead>
              <TableHead className="text-white/60">Time</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading activities...
                  </div>
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="h-12 w-12 text-white/20" />
                    <p>No activities found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <Badge className={getActionColor(activity.action)}>
                      {formatAction(activity.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.image || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-[10px]">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white text-sm">{activity.user.name || "Unknown"}</div>
                        <div className="text-xs text-white/40">{activity.user.email}</div>
                      </div>
                    </div>
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
                    {activity.ipAddress || "-"}
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription className="text-white/60">
              Detailed information about this activity
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
                <p className="text-sm text-white/40">User</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedActivity?.user.image || undefined} />
                    <AvatarFallback className="bg-white/10 text-white text-[10px]">
                      {getInitials(selectedActivity?.user.name || null)}
                    </AvatarFallback>
                  </Avatar>
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