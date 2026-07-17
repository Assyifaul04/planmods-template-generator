// app/admin/projects/visibility/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, Lock, Users, RefreshCw } from "lucide-react";

interface VisibilityStats {
  totalProjects: number;
  visibilityCounts: Array<{
    visibility: string;
    _count: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    visibility: string;
    user: {
      name: string | null;
      email: string;
    };
    createdAt: string;
  }>;
}

export default function VisibilitySettingsPage() {
  const [stats, setStats] = useState<VisibilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchVisibilityStats();
  }, []);

  const fetchVisibilityStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/projects/visibility");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching visibility stats:", error);
      toast.error("Failed to fetch visibility statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisibility = async (projectId: string, visibility: string) => {
    try {
      setUpdating(projectId);
      const response = await fetch(`/api/admin/projects/${projectId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });

      if (!response.ok) throw new Error("Failed to update visibility");

      toast.success("Visibility updated successfully");
      fetchVisibilityStats();
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdating(null);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    const icons: Record<string, any> = {
      PRIVATE: Lock,
      UNLISTED: Users,
      PUBLIC: Globe,
    };
    return icons[visibility] || Globe;
  };

  const getVisibilityColor = (visibility: string) => {
    const colors: Record<string, string> = {
      PRIVATE: "bg-red-500/20 text-red-400 border-red-500/30",
      UNLISTED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      PUBLIC: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[visibility] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading visibility settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Visibility Settings</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage project visibility settings across the platform
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchVisibilityStats}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalProjects || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Public Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.visibilityCounts.find(v => v.visibility === "PUBLIC")?._count || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Private Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats?.visibilityCounts.find(v => v.visibility === "PRIVATE")?._count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Project Visibility Management</CardTitle>
          <CardDescription className="text-white/60">
            Update visibility settings for individual projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Project</TableHead>
                <TableHead className="text-white/60">Owner</TableHead>
                <TableHead className="text-white/60">Current Visibility</TableHead>
                <TableHead className="text-white/60">Change Visibility</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.projects.map((project) => {
                const Icon = getVisibilityIcon(project.visibility);
                return (
                  <TableRow key={project.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{project.name}</TableCell>
                    <TableCell>
                      <div className="text-white/60">{project.user.name || "Unknown"}</div>
                      <div className="text-xs text-white/40">{project.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVisibilityColor(project.visibility)}>
                        <Icon className="h-3 w-3 mr-1" />
                        {project.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={project.visibility}
                        onValueChange={(value) => handleUpdateVisibility(project.id, value)}
                        disabled={updating === project.id}
                      >
                        <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          <SelectItem value="PRIVATE">Private</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                        </SelectContent>
                      </Select>
                      {updating === project.id && (
                        <div className="text-xs text-white/40 mt-1">Updating...</div>
                      )}
                    </TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!stats?.projects || stats.projects.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-8">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}