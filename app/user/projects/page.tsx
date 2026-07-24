// app/user/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderIcon,
  Globe,
  Lock,
  Users,
  Star,
  Download,
  Plus,
  Loader2,
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
  updatedAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  _count: {
    downloads: number;
    stars: number;
    builds: number;
    collaborators: number;
  };
}

export default function MyProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [search, page, statusFilter, visibilityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(statusFilter && { status: statusFilter }),
        ...(visibilityFilter && { visibility: visibilityFilter }),
      });
      
      const response = await fetch(`/api/user/projects?${params}`);
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
    if (!projectId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      await fetchProjects();
      setShowDeleteDialog(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setIsDeleting(false);
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

  // Filter out ARCHIVED projects from showing in the list
  const visibleProjects = projects.filter(p => p.status !== "ARCHIVED");

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Projects
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Manage all your Minecraft mod projects
          </p>
        </div>
        <Button
          onClick={() => router.push("/user/generator")}
          className="bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
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

        <Button
          variant="outline"
          onClick={fetchProjects}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Projects Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Visibility</TableHead>
              <TableHead className="text-white/60 font-medium">Stats</TableHead>
              <TableHead className="text-white/60 font-medium">Created</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading projects...
                  </div>
                </TableCell>
              </TableRow>
            ) : visibleProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <FolderIcon className="h-12 w-12 text-white/20" />
                    <p>No projects found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/user/generator")}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first project
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleProjects.map((project) => (
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
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      {project.platform}
                    </Badge>
                    <div className="text-xs text-white/30 mt-1">{project.loader}</div>
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
                  <TableCell className="text-white/40 text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
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
                          onClick={() => router.push(`/user/projects/${project.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/user/projects/${project.id}/edit`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!isDeleting) setShowDeleteDialog(open);
      }}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              All project data including downloads, builds, and collaborators will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)} 
              disabled={isDeleting}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleDeleteProject(selectedProject?.id!)} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}