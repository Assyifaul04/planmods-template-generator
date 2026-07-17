// app/admin/users/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  MoreVertical,
  UserCog,
  Ban,
  ShieldCheck,
  Shield,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  CircleUserRound,
  FolderKanban,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  role: "ADMIN" | "USER";
  plan: "FREE" | "PRO" | "TEAM";
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    projects: number;
    downloads: number;
  };
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER");

  // Debounce search input so we don't hammer the API on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}`
      );
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total ?? data.users.length);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast.success(`User ${isBanned ? "banned" : "unbanned"} successfully`);
      await fetchUsers();
      setShowBanDialog(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: "ADMIN" | "USER") => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      toast.success(`Role updated to ${role}`);
      await fetchUsers();
      setShowRoleDialog(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("User deleted successfully");
      await fetchUsers();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") {
      return (
        <Badge className="gap-1 bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/20">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-white/60 border-white/15">
        User
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      TEAM: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      PRO: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      FREE: "bg-white/5 text-white/50 border-white/15",
    };
    return (
      <Badge variant="outline" className={styles[plan] ?? styles.FREE}>
        {plan}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean, isBanned: boolean) => {
    if (isBanned) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Banned
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge className="gap-1 bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-yellow-400/80 border-yellow-400/25">
        Inactive
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const banned = users.filter((u) => u.isBanned).length;
    const active = users.filter((u) => u.isActive && !u.isBanned).length;
    return { admins, banned, active };
  }, [users]);

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      accent: "text-white",
      bg: "bg-white/5",
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: ShieldCheck,
      accent: "text-purple-300",
      bg: "bg-purple-500/10",
    },
    {
      label: "Active (this page)",
      value: stats.active,
      icon: CircleUserRound,
      accent: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Banned (this page)",
      value: stats.banned,
      icon: Ban,
      accent: "text-red-300",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Users Management
            </h2>
            <p className="text-sm text-white/50 mt-1">
              Manage all users, roles, and account status
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/users/roles")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            <Shield className="h-4 w-4 mr-2" />
            Roles &amp; Permissions
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map((s) => (
            <Card
              key={s.label}
              className="border-white/10 bg-black/40 shadow-none"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-white/50">{s.label}</p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {loading ? (
                      <Skeleton className="h-7 w-10 bg-white/10" />
                    ) : (
                      s.value
                    )}
                  </p>
                </div>
                <div className={`rounded-full p-2.5 ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search users by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={fetchUsers}
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

        {/* Users Table */}
        <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-white/[0.04]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50 font-medium">User</TableHead>
                <TableHead className="text-white/50 font-medium">Role</TableHead>
                <TableHead className="text-white/50 font-medium">Plan</TableHead>
                <TableHead className="text-white/50 font-medium">Status</TableHead>
                <TableHead className="text-white/50 font-medium">Projects</TableHead>
                <TableHead className="text-white/50 font-medium">Downloads</TableHead>
                <TableHead className="text-white/50 font-medium">Joined</TableHead>
                <TableHead className="text-white/50 font-medium text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10 hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-28 bg-white/10" />
                          <Skeleton className="h-2.5 w-36 bg-white/5" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-14 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-6 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-6 bg-white/10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded ml-auto bg-white/10" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-14">
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <div className="rounded-full bg-white/5 p-3">
                        <Users className="h-5 w-5 text-white/30" />
                      </div>
                      <p className="text-white/70 text-sm font-medium">
                        No users found
                      </p>
                      <p className="text-white/40 text-xs">
                        {debouncedSearch
                          ? `No results for "${debouncedSearch}". Try a different search.`
                          : "Users will show up here once they sign up."}
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
                        <div>
                          <div className="text-white font-medium leading-tight">
                            {user.name || "Unknown"}
                          </div>
                          <div className="text-xs text-white/40">{user.email}</div>
                          {user.username && (
                            <div className="text-xs text-white/25">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getPlanBadge(user.plan)}</TableCell>
                    <TableCell>
                      {getStatusBadge(user.isActive, user.isBanned)}
                    </TableCell>
                    <TableCell className="text-white/60">
                      <span className="inline-flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-white/30" />
                        {user._count.projects}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/60">
                      <span className="inline-flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5 text-white/30" />
                        {user._count.downloads}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-neutral-950 border-white/10 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleDialog(true);
                              setNewRole(user.role);
                            }}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanDialog(true);
                            }}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {user.isBanned ? "Unban" : "Ban"} User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                            className="hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-white/40">
            Page {page} of {totalPages}
            {totalUsers > 0 && (
              <span className="text-white/25"> · {totalUsers} total users</span>
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

        {/* Ban / Unban — destructive confirmation via AlertDialog */}
        <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <AlertDialogContent className="bg-neutral-950 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser?.isBanned ? "Unban" : "Ban"} {selectedUser?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                {selectedUser?.isBanned
                  ? "This user will regain access to the platform immediately."
                  : "This user will lose access to the platform immediately."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {!selectedUser?.isBanned && (
              <Alert className="border-red-500/20 bg-red-500/10 text-red-300">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-300">Heads up</AlertTitle>
                <AlertDescription className="text-red-300/80">
                  Active sessions won't be revoked automatically — the user
                  will be blocked on their next request.
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
                  handleBanUser(selectedUser?.id!, !selectedUser?.isBanned);
                }}
                className={
                  selectedUser?.isBanned
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }
              >
                {actionLoading
                  ? "Please wait..."
                  : `${selectedUser?.isBanned ? "Unban" : "Ban"} User`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Role Dialog — non-destructive, stays a regular Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="bg-neutral-950 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription className="text-white/50">
                Update permissions for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>

            {newRole === "ADMIN" && (
              <Alert className="border-purple-500/20 bg-purple-500/10 text-purple-300">
                <ShieldCheck className="h-4 w-4 text-purple-300" />
                <AlertTitle className="text-purple-300">Admin access</AlertTitle>
                <AlertDescription className="text-purple-300/80">
                  Admins can manage users, roles, and platform-wide settings.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 py-2">
              <Button
                variant={newRole === "USER" ? "default" : "outline"}
                onClick={() => setNewRole("USER")}
                className={
                  newRole === "USER"
                    ? "flex-1 bg-white text-black hover:bg-white/90"
                    : "flex-1 border-white/10 text-white hover:bg-white/10"
                }
              >
                <CircleUserRound className="h-4 w-4 mr-2" />
                User
              </Button>
              <Button
                variant={newRole === "ADMIN" ? "default" : "outline"}
                onClick={() => setNewRole("ADMIN")}
                className={
                  newRole === "ADMIN"
                    ? "flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                    : "flex-1 border-white/10 text-white hover:bg-white/10"
                }
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                disabled={actionLoading || newRole === selectedUser?.role}
                onClick={() => handleUpdateRole(selectedUser?.id!, newRole)}
                className="bg-white text-black hover:bg-white/90 disabled:opacity-40"
              >
                {actionLoading ? "Saving..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog — destructive confirmation via AlertDialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-neutral-950 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedUser?.name}?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Alert className="border-red-500/20 bg-red-500/10 text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-300">
                This is permanent
              </AlertTitle>
              <AlertDescription className="text-red-300/80">
                All projects, downloads, and API keys belonging to this user
                will be permanently deleted along with their account.
              </AlertDescription>
            </Alert>

            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={actionLoading}
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteUser(selectedUser?.id!);
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {actionLoading ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}