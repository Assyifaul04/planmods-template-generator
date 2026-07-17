// app/admin/projects/archived/page.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Archive,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

interface ArchivedProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  loader: string;
  archivedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    downloads: number;
    stars: number;
    builds: number;
  };
}

export default function ArchivedProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState<ArchivedProject | null>(null);
  const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchArchivedProjects();
  }, [search, page]);

  const fetchArchivedProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      
      const response = await fetch(`/api/admin/projects/archived?${params}`);
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching archived projects:", error);
      toast.error("Failed to fetch archived projects");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });

      if (!response.ok) throw new Error("Failed to unarchive project");

      toast.success("Project unarchived successfully");
      fetchArchivedProjects();
      setShowUnarchiveDialog(false);
    } catch (error) {
      console.error("Error unarchiving project:", error);
      toast.error("Failed to unarchive project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      toast.success("Project deleted successfully");
      fetchArchivedProjects();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Archived Projects</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage archived projects and restore them if needed
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/projects")}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          All Projects
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search archived projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchArchivedProjects}
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
              <TableHead className="text-white/60">Project</TableHead>
              <TableHead className="text-white/60">Owner</TableHead>
              <TableHead className="text-white/60">Platform</TableHead>
              <TableHead className="text-white/60">Stats</TableHead>
              <TableHead className="text-white/60">Archived</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading archived projects...
                  </div>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  No archived projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-white/10 hover:bg-white/5">
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
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      {project.platform}
                    </Badge>
                    <div className="text-xs text-white/30 mt-1">{project.loader}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-white/60">
                      <div>⭐ {project._count.stars}</div>
                      <div>📥 {project._count.downloads}</div>
                      <div>🔨 {project._count.builds}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(project.archivedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setShowUnarchiveDialog(true);
                        }}
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Unarchive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setShowDeleteDialog(true);
                        }}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Unarchive Dialog */}
      <Dialog open={showUnarchiveDialog} onOpenChange={setShowUnarchiveDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Unarchive Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to unarchive "{selectedProject?.name}"?
              This will make the project visible again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnarchiveDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUnarchiveProject(selectedProject?.id!)}
              className="bg-green-500 hover:bg-green-600"
            >
              Unarchive Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              All project data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteProject(selectedProject?.id!)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}