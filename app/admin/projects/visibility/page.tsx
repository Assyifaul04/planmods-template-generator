// app/admin/projects/visibility/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Globe, Lock, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface VisibilityProject {
  id: string;
  name: string;
  slug: string;
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function VisibilitySettingsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<VisibilityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchVisibilityData();
  }, []);

  const fetchVisibilityData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/projects/visibility");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching visibility data:", error);
      toast.error("Failed to fetch visibility data");
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
      fetchVisibilityData();
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdating(null);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "PRIVATE": return <Lock className="h-3 w-3 mr-1" />;
      case "UNLISTED": return <Users className="h-3 w-3 mr-1" />;
      case "PUBLIC": return <Globe className="h-3 w-3 mr-1" />;
      default: return <Globe className="h-3 w-3 mr-1" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "PRIVATE": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "UNLISTED": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PUBLIC": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
          onClick={() => router.push("/admin/projects")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Visibility Settings</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage project visibility settings
          </p>
        </div>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Project Visibility</CardTitle>
              <CardDescription className="text-white/60">
                Update visibility for individual projects
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchVisibilityData}
              className="border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-white/40">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-white/40">
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} className="border-white/10">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{project.name}</div>
                        <div className="text-xs text-white/40">{project.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.user.image || undefined} />
                          <AvatarFallback className="bg-white/10 text-white text-[10px]">
                            {getInitials(project.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white text-sm">{project.user.name || "Unknown"}</div>
                          <div className="text-xs text-white/40">{project.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVisibilityColor(project.visibility)}>
                        {getVisibilityIcon(project.visibility)}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}