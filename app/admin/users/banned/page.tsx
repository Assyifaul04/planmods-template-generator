// app/admin/users/banned/page.tsx
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  RefreshCw,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Ban,
  ArrowLeft,
  ShieldCheck,
  CalendarClock,
  MessageSquareWarning,
} from "lucide-react";
import { toast } from "sonner";

interface BannedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isBanned: boolean;
  bannedAt: string;
  reason?: string;
}

export default function BannedUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBanned, setTotalBanned] = useState(0);
  const [selectedUser, setSelectedUser] = useState<BannedUser | null>(null);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchBannedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const fetchBannedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users/banned?page=${page}&limit=10&search=${debouncedSearch}`
      );
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalBanned(data.pagination.total ?? data.users.length);
    } catch (error) {
      console.error("Error fetching banned users:", error);
      toast.error("Failed to fetch banned users");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: false }),
      });

      if (!response.ok) throw new Error("Failed to unban user");

      toast.success("User unbanned successfully");
      await fetchBannedUsers();
      setShowUnbanDialog(false);
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    } finally {
      setActionLoading(false);
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Banned Users
            </h2>
            <p className="text-sm text-white/50 mt-1">
              Review banned accounts and restore access when needed
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/users")}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Users
          </Button>
        </div>

        {/* Stat card */}
        <Card className="border-white/10 bg-black/40 shadow-none mb-6 max-w-xs">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-white/50">Currently Banned</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {loading ? (
                  <Skeleton className="h-7 w-10 bg-white/10" />
                ) : (
                  totalBanned
                )}
              </p>
            </div>
            <div className="rounded-full p-2.5 bg-red-500/10">
              <Ban className="h-4 w-4 text-red-300" />
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search banned users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={fetchBannedUsers}
                className="border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw
                  className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reload the list</TooltipContent>
          </Tooltip>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-white/[0.04]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 font-medium">User</TableHead>
                <TableHead className="text-white/50 font-medium">Email</TableHead>
                <TableHead className="text-white/50 font-medium">Banned On</TableHead>
                <TableHead className="text-white/50 font-medium">Reason</TableHead>
                <TableHead className="text-white/50 font-medium">Status</TableHead>
                <TableHead className="text-white/50 font-medium text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10 hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                        <Skeleton className="h-3 w-24 bg-white/10" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-3 w-32 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-20 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-28 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-white/10" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 rounded ml-auto bg-white/10" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-14">
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <div className="rounded-full bg-white/5 p-3">
                        <ShieldCheck className="h-5 w-5 text-white/30" />
                      </div>
                      <p className="text-white/70 text-sm font-medium">
                        No banned users
                      </p>
                      <p className="text-white/40 text-xs">
                        {debouncedSearch
                          ? `No results for "${debouncedSearch}".`
                          : "Nobody is currently banned from the platform."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-white/10 hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-white/10 text-white text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-white font-medium">
                          {user.name || "Unknown"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{user.email}</TableCell>
                    <TableCell className="text-white/50 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-white/30" />
                        {user.bannedAt
                          ? new Date(user.bannedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/50 text-sm max-w-[220px] truncate">
                      {user.reason ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquareWarning className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          <span className="truncate">{user.reason}</span>
                        </span>
                      ) : (
                        <span className="text-white/25">No reason given</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Banned
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUnbanDialog(true);
                        }}
                        className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                        size="sm"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unban
                      </Button>
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
            {totalBanned > 0 && (
              <span className="text-white/25"> · {totalBanned} banned total</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Unban confirmation */}
        <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
          <AlertDialogContent className="bg-neutral-950 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Unban {selectedUser?.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This will restore the user's access to the platform
                immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {selectedUser?.reason && (
              <Alert className="border-white/10 bg-white/5 text-white/70">
                <MessageSquareWarning className="h-4 w-4 text-white/40" />
                <AlertTitle className="text-white/70">
                  Originally banned for
                </AlertTitle>
                <AlertDescription className="text-white/50">
                  {selectedUser.reason}
                </AlertDescription>
              </Alert>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={actionLoading}
                onClick={(e) => {
                  e.preventDefault();
                  handleUnbanUser(selectedUser?.id!);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {actionLoading ? "Please wait..." : "Unban User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}