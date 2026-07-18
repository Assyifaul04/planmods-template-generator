// app/admin/users/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Shield, Users, Crown, Check, X } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    projects: number;
    downloads: number;
  };
}

export default function RolesPage() {
  const router = useRouter();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ adminCount: 0, userCount: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesData();
  }, []);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users/roles");
      const data = await response.json();
      setAdminUsers(data.adminUsers || []);
      setStats({
        adminCount: data.adminCount || 0,
        userCount: data.userCount || 0,
        totalUsers: data.totalUsers || 0,
      });
    } catch (error) {
      console.error("Error fetching roles data:", error);
      toast.error("Failed to fetch roles data");
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-semibold text-white">User Roles</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage user roles and view role distribution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.adminCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/60">{stats.userCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Admin Users</CardTitle>
          <CardDescription className="text-white/60">
            All users with administrator privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">User</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60">Projects</TableHead>
                <TableHead className="text-white/60">Downloads</TableHead>
                <TableHead className="text-white/60">Joined</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/40">
                    Loading admin users...
                  </TableCell>
                </TableRow>
              ) : adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/40">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                adminUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-white/10 text-white text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white">{user.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{user.email}</TableCell>
                    <TableCell className="text-white/60">{user._count.projects}</TableCell>
                    <TableCell className="text-white/60">{user._count.downloads}</TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Role Permissions</CardTitle>
          <CardDescription className="text-white/60">
            Overview of permissions granted to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Permission</TableHead>
                <TableHead className="text-white/60 text-center">Admin</TableHead>
                <TableHead className="text-white/60 text-center">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "View Users", admin: true, user: false },
                { name: "Create/Edit Users", admin: true, user: false },
                { name: "Delete Users", admin: true, user: false },
                { name: "Manage Roles", admin: true, user: false },
                { name: "Manage Plans", admin: true, user: false },
                { name: "View Projects", admin: true, user: true },
                { name: "Create Projects", admin: true, user: true },
                { name: "Edit Projects", admin: true, user: true },
                { name: "Delete Projects", admin: true, user: false },
                { name: "View Templates", admin: true, user: true },
                { name: "Manage Templates", admin: true, user: false },
                { name: "View Analytics", admin: true, user: false },
                { name: "Manage System Settings", admin: true, user: false },
              ].map((permission) => (
                <TableRow key={permission.name} className="border-white/10">
                  <TableCell className="text-white">{permission.name}</TableCell>
                  <TableCell className="text-center">
                    {permission.admin ? (
                      <Check className="h-4 w-4 text-green-400 inline" />
                    ) : (
                      <X className="h-4 w-4 text-red-400 inline" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {permission.user ? (
                      <Check className="h-4 w-4 text-green-400 inline" />
                    ) : (
                      <X className="h-4 w-4 text-red-400 inline" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}