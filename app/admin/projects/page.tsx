// app/admin/projects/page.tsx
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
  Eye,
  Edit,
  Archive,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderIcon,
  Globe,
  Lock,
  Users,
  GitBranch,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  status: "DRAFT" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  version: string;
  starsCount: number;
  downloadsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
  template: {
    id: string;
    name: string;
    slug: string;
  } | null;
  mcVersionData: {
    version: string;
    platform: string;
  } | null;
  githubRepository: {
    id: string;
    repositoryName: string;
    repositoryUrl: string;
    private: boolean;
  } | null;
  _count: {
    downloads: number;
    stars: number;
    builds: number;
    collaborators: number;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");

  useEffect(() => {
    fetchProjects();
  }, [search, page, statusFilter, visibilityFilter, platformFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(statusFilter && { status: statusFilter }),
        ...(visibilityFilter && { visibility: visibilityFilter }),
        ...(platformFilter && { platform: platformFilter }),
      });
      
      const response = await fetch(`/api/admin/projects?${params}`);
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      toast.success("Project deleted successfully");
      fetchProjects();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleArchiveProject = async (projectId: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });

      if (!response.ok) throw new Error("Failed to archive project");

      toast.success(`Project ${archived ? "archived" : "unarchived"} successfully`);
      fetchProjects();
      setShowArchiveDialog(false);
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Failed to archive project");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
      GENERATING: { label: "Generating", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      READY: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      FAILED: { label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      ARCHIVED: { label: "Archived", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    };
    const statusInfo = statusMap[status] || statusMap.DRAFT;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityMap: Record<string, { label: string; icon: any }> = {
      PRIVATE: { label: "Private", icon: Lock },
      UNLISTED: { label: "Unlisted", icon: Users },
      PUBLIC: { label: "Public", icon: Globe },
    };
    const info = visibilityMap[visibility] || visibilityMap.PRIVATE;
    const Icon = info.icon;
    return (
      <Badge variant="outline" className="text-white/60 border-white/20">
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
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
          <h2 className="text-2xl font-semibold text-white">Projects Management</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all projects across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/projects/status")}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <FolderIcon className="h-4 w-4 mr-2" />
            View Status
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="GENERATING">Generating</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Visibility" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Visibility</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="UNLISTED">Unlisted</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Platforms</SelectItem>
            <SelectItem value="JAVA">Java</SelectItem>
            <SelectItem value="BEDROCK">Bedrock</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchProjects}
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
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Owner</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">MC Version</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Visibility</TableHead>
              <TableHead className="text-white/60 font-medium">Stats</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading projects...
                  </div>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <div className="text-white font-medium">{project.name}</div>
                      <div className="text-xs text-white/40">{project.slug}</div>
                      {project.template && (
                        <div className="text-xs text-white/30">
                          Template: {project.template.name}
                        </div>
                      )}
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
                  <TableCell className="text-white/60 text-sm">
                    {project.minecraftVersion}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{getVisibilityBadge(project.visibility)}</TableCell>
                  <TableCell>
                    <div className="text-xs text-white/60">
                      <div>⭐ {project.starsCount}</div>
                      <div>📥 {project.downloadsCount}</div>
                      <div>🔨 {project._count.builds}</div>
                      <div>👥 {project._count.collaborators}</div>
                    </div>
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
                          onClick={() => router.push(`/admin/projects/${project.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/projects/${project.id}/collaborators`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Collaborators
                        </DropdownMenuItem>
                        {project.githubRepository && (
                          <DropdownMenuItem
                            onClick={() => window.open(project.githubRepository?.repositoryUrl, "_blank")}
                            className="hover:bg-white/10 cursor-pointer"
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            GitHub Repo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setShowArchiveDialog(true);
                          }}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {project.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setShowDeleteDialog(true);
                          }}
                          className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              All project data including downloads, builds, and stars will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={() => handleDeleteProject(selectedProject?.id!)} className="bg-red-500 hover:bg-red-600">
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{selectedProject?.status === "ARCHIVED" ? "Unarchive" : "Archive"} Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to {selectedProject?.status === "ARCHIVED" ? "unarchive" : "archive"} "{selectedProject?.name}"?
              {selectedProject?.status !== "ARCHIVED" && " Archived projects will be hidden from public view."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={() => handleArchiveProject(selectedProject?.id!, selectedProject?.status !== "ARCHIVED")}
              className={selectedProject?.status === "ARCHIVED" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
            >
              {selectedProject?.status === "ARCHIVED" ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}