// app/admin/users/page.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MoreVertical,
  UserCog,
  Ban,
  Shield,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Crown,
  Star,
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
  updatedAt: string;
  lastLoginAt: string | null;
  _count: {
    projects: number;
    downloads: number;
    apiKeys: number;
    collaborations: number;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER");
  const [newPlan, setNewPlan] = useState<"FREE" | "PRO" | "TEAM">("FREE");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, [search, page, roleFilter, planFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      
      // Only append filters if they have values
      if (roleFilter && roleFilter !== "") {
        params.append("role", roleFilter);
      }
      if (planFilter && planFilter !== "") {
        params.append("plan", planFilter);
      }
      if (statusFilter && statusFilter !== "") {
        params.append("isBanned", statusFilter);
      }
      
      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast.success(`User ${isBanned ? "banned" : "unbanned"} successfully`);
      fetchUsers();
      setShowBanDialog(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleUpdateRole = async (userId: string, role: "ADMIN" | "USER") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      toast.success(`Role updated to ${role}`);
      fetchUsers();
      setShowRoleDialog(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleUpdatePlan = async (userId: string, plan: "FREE" | "PRO" | "TEAM") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) throw new Error("Failed to update plan");

      toast.success(`Plan updated to ${plan}`);
      fetchUsers();
      setShowPlanDialog(false);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("User deleted successfully");
      fetchUsers();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Admin</Badge>;
    }
    return <Badge variant="outline" className="text-white/60">User</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "border-gray-500/30 text-gray-400",
      PRO: "border-blue-500/30 text-blue-400",
      TEAM: "border-orange-500/30 text-orange-400",
    };
    return <Badge variant="outline" className={colors[plan] || ""}>{plan}</Badge>;
  };

  const getStatusBadge = (isActive: boolean, isBanned: boolean) => {
    if (isBanned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">Inactive</Badge>;
  };

  // Reset filters
  const resetFilters = () => {
    setRoleFilter("");
    setPlanFilter("");
    setStatusFilter("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all users, their roles, plans, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/users/roles")}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </Button>
          <Button
            onClick={() => router.push("/admin/users/plans")}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <Star className="h-4 w-4 mr-2" />
            Plans
          </Button>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-white/10 text-white hover:bg-white/10"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Plans</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="TEAM">Team</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Banned</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchUsers}
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
              <TableHead className="text-white/60 font-medium">User</TableHead>
              <TableHead className="text-white/60 font-medium">Role</TableHead>
              <TableHead className="text-white/60 font-medium">Plan</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Projects</TableHead>
              <TableHead className="text-white/60 font-medium">Downloads</TableHead>
              <TableHead className="text-white/60 font-medium">Joined</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-white/20" />
                    <p>No users found</p>
                    <p className="text-sm text-white/30">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white font-medium">{user.name || "Unknown"}</div>
                        <div className="text-xs text-white/40">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-white/30">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getPlanBadge(user.plan)}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive, user.isBanned)}</TableCell>
                  <TableCell className="text-white/60">{user._count.projects}</TableCell>
                  <TableCell className="text-white/60">{user._count.downloads}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
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
                            setSelectedUser(user);
                            setShowRoleDialog(true);
                            setNewRole(user.role);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPlanDialog(true);
                            setNewPlan(user.plan);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Change Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanDialog(true);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {user.isBanned ? "Unban" : "Ban"} User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
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

      {/* Dialogs remain the same */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{selectedUser?.isBanned ? "Unban" : "Ban"} User</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to {selectedUser?.isBanned ? "unban" : "ban"} {selectedUser?.name}?
              {!selectedUser?.isBanned && " This will prevent them from accessing the platform."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleBanUser(selectedUser?.id!, !selectedUser?.isBanned)}
              className={selectedUser?.isBanned ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
            >
              {selectedUser?.isBanned ? "Unban" : "Ban"} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription className="text-white/60">
              Change role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            <Button
              variant={newRole === "USER" ? "default" : "outline"}
              onClick={() => setNewRole("USER")}
              className={newRole === "USER" ? "bg-white text-black hover:bg-white/90" : "border-white/10 text-white hover:bg-white/10"}
            >
              User
            </Button>
            <Button
              variant={newRole === "ADMIN" ? "default" : "outline"}
              onClick={() => setNewRole("ADMIN")}
              className={newRole === "ADMIN" ? "bg-purple-500 hover:bg-purple-600" : "border-white/10 text-white hover:bg-white/10"}
            >
              Admin
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateRole(selectedUser?.id!, newRole)}
              className="bg-white text-black hover:bg-white/90"
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Change User Plan</DialogTitle>
            <DialogDescription className="text-white/60">
              Change subscription plan for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            {["FREE", "PRO", "TEAM"].map((plan) => (
              <Button
                key={plan}
                variant={newPlan === plan ? "default" : "outline"}
                onClick={() => setNewPlan(plan as "FREE" | "PRO" | "TEAM")}
                className={
                  newPlan === plan
                    ? plan === "FREE"
                      ? "bg-gray-500 hover:bg-gray-600"
                      : plan === "PRO"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-orange-500 hover:bg-orange-600"
                    : "border-white/10 text-white hover:bg-white/10"
                }
              >
                {plan}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdatePlan(selectedUser?.id!, newPlan)}
              className="bg-white text-black hover:bg-white/90"
            >
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              All user data including projects, downloads, and API keys will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteUser(selectedUser?.id!)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}