// app/admin/users/roles/page.tsx
"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ShieldCheck,
  Users,
  CircleUserRound,
  Check,
  Minus,
  ArrowLeft,
  LayoutGrid,
  FolderKanban,
  FileStack,
  BarChart3,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

interface RoleStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
}

interface Permission {
  name: string;
  admin: boolean;
  user: boolean;
}

interface PermissionGroup {
  label: string;
  icon: typeof LayoutGrid;
  permissions: Permission[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "User Management",
    icon: Users,
    permissions: [
      { name: "View Users", admin: true, user: false },
      { name: "Create Users", admin: true, user: false },
      { name: "Edit Users", admin: true, user: false },
      { name: "Delete Users", admin: true, user: false },
      { name: "Manage Roles", admin: true, user: false },
    ],
  },
  {
    label: "Projects",
    icon: FolderKanban,
    permissions: [
      { name: "View Projects", admin: true, user: true },
      { name: "Create Projects", admin: true, user: true },
      { name: "Edit Projects", admin: true, user: true },
      { name: "Delete Projects", admin: true, user: false },
    ],
  },
  {
    label: "Templates",
    icon: FileStack,
    permissions: [
      { name: "View Templates", admin: true, user: true },
      { name: "Create Templates", admin: true, user: false },
      { name: "Delete Templates", admin: true, user: false },
    ],
  },
  {
    label: "System",
    icon: Settings2,
    permissions: [
      { name: "View Analytics", admin: true, user: false },
      { name: "Manage System Settings", admin: true, user: false },
    ],
  },
];

export default function RolesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RoleStats>({
    totalUsers: 0,
    adminCount: 0,
    userCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleStats();
  }, []);

  const fetchRoleStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users/roles/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching role stats:", error);
      toast.error("Failed to fetch role statistics");
    } finally {
      setLoading(false);
    }
  };

  const adminShare = useMemo(() => {
    if (!stats.totalUsers) return 0;
    return Math.round((stats.adminCount / stats.totalUsers) * 100);
  }, [stats]);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      accent: "text-white",
      bg: "bg-white/5",
      hint: "Across all roles",
    },
    {
      label: "Admins",
      value: stats.adminCount,
      icon: ShieldCheck,
      accent: "text-purple-300",
      bg: "bg-purple-500/10",
      hint: stats.totalUsers ? `${adminShare}% of all users` : undefined,
    },
    {
      label: "Users",
      value: stats.userCount,
      icon: CircleUserRound,
      accent: "text-white/70",
      bg: "bg-white/5",
      hint: "Standard access",
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Roles &amp; Permissions
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Manage user roles and see what each one can access
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/users")}
          variant="outline"
          className="border-white/10 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="border-white/10 bg-black/40 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {loading ? (
                    <Skeleton className="h-7 w-12 bg-white/10" />
                  ) : (
                    s.value
                  )}
                </p>
                {!loading && s.hint && (
                  <p className="text-xs text-white/30 mt-0.5">{s.hint}</p>
                )}
              </div>
              <div className={`rounded-full p-2.5 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.accent}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions matrix */}
      <Card className="border-white/10 bg-black/40 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Role Permissions</CardTitle>
            <CardDescription className="text-white/50">
              What each role can see and do across the platform
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Badge className="gap-1 bg-purple-500/15 text-purple-300 border-purple-500/30">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Badge>
            <Badge variant="outline" className="text-white/60 border-white/15">
              User
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/[0.04]">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium">
                    Permission
                  </TableHead>
                  <TableHead className="text-white/50 font-medium text-center w-28">
                    Admin
                  </TableHead>
                  <TableHead className="text-white/50 font-medium text-center w-28">
                    User
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_GROUPS.map((group) => (
                  <Fragment key={group.label}>
                    <TableRow
                      className="border-white/10 bg-white/[0.02] hover:bg-white/[0.02]"
                    >
                      <TableCell colSpan={3} className="py-2">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/40">
                          <group.icon className="h-3.5 w-3.5" />
                          {group.label}
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.permissions.map((permission) => (
                      <TableRow
                        key={permission.name}
                        className="border-white/10 hover:bg-white/[0.03] transition-colors"
                      >
                        <TableCell className="text-white/80 pl-8">
                          {permission.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.admin ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/15">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/5">
                              <Minus className="h-3.5 w-3.5 text-white/25" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.user ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/15">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/5">
                              <Minus className="h-3.5 w-3.5 text-white/25" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-white/30 mt-3">
            Permissions are fixed per role. To change what a user can do,
            update their role from the Users page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}