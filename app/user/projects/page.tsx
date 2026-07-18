// app/user/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PlusIcon,
  FolderIcon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  ArchiveIcon,
  CopyIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  XCircleIcon,
  FileEditIcon,
  GitBranchIcon,
  DownloadIcon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  loader: string;
  minecraftVersion: string;
  status: string;
  visibility: string;
  starsCount: number;
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  _count: {
    builds: number;
    downloads: number;
    stars: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  READY: { label: "Ready", icon: CheckCircle2Icon, className: "text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircleIcon, className: "text-red-400" },
  DRAFT: { label: "Draft", icon: FileEditIcon, className: "text-yellow-400" },
  GENERATING: { label: "Generating", icon: RefreshCwIcon, className: "text-blue-400" },
  ARCHIVED: { label: "Archived", icon: ArchiveIcon, className: "text-white/40" },
};

const visibilityConfig: Record<
  string,
  { label: string; className: string }
> = {
  PUBLIC: { label: "Public", className: "text-green-400 border-green-400/30" },
  UNLISTED: { label: "Unlisted", className: "text-yellow-400 border-yellow-400/30" },
  PRIVATE: { label: "Private", className: "text-white/40 border-white/10" },
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, visibilityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (visibilityFilter) params.append("visibility", visibilityFilter);

      const response = await fetch(`/api/user/projects?${params}`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/user/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success("Project deleted successfully");
      setShowDeleteDialog(false);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`border-none ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const config = visibilityConfig[visibility];
    if (!config) return <Badge variant="outline">{visibility}</Badge>;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Project ID copied!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-white/40">Manage your Minecraft projects</p>
        </div>
        <Button
          onClick={() => router.push("/user/projects/create")}
          className="bg-white text-black hover:bg-white/90"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="GENERATING">Generating</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Visibility" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Visibility</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="UNLISTED">Unlisted</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStatusFilter("");
            setVisibilityFilter("");
          }}
          className="text-white/40 hover:text-white hover:bg-white/5"
        >
          Clear filters
        </Button>
      </div>

      {/* Projects Table */}
      <Card className="border-white/10 bg-white/[0.02] p-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/5" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
            <FolderIcon className="h-10 w-10 text-white/20" />
            <p className="text-white text-sm font-medium">No projects yet</p>
            <p className="text-white/40 text-sm">Create your first project to get started</p>
            <Button
              onClick={() => router.push("/user/projects/create")}
              className="bg-white text-black hover:bg-white/90 mt-2"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/40 text-xs font-medium">Name</TableHead>
                <TableHead className="text-white/40 text-xs font-medium">Platform</TableHead>
                <TableHead className="text-white/40 text-xs font-medium">Status</TableHead>
                <TableHead className="text-white/40 text-xs font-medium">Visibility</TableHead>
                <TableHead className="text-white/40 text-xs font-medium text-center">Stats</TableHead>
                <TableHead className="text-white/40 text-xs font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="border-white/5 hover:bg-white/5 cursor-pointer"
                  onClick={() => router.push(`/user/projects/${project.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="text-white font-medium text-sm">{project.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/30">{project.slug}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyId(project.id);
                          }}
                          className="text-white/20 hover:text-white/40 transition-colors"
                        >
                          <CopyIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-white/60">{project.platform}</p>
                      <p className="text-xs text-white/30">{project.loader}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{getVisibilityBadge(project.visibility)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-white/40">
                        <DownloadIcon className="h-3 w-3" />
                        {project.downloadsCount}
                      </span>
                      <span className="flex items-center gap-1 text-white/40">
                        <StarIcon className="h-3 w-3" />
                        {project.starsCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8"
                        >
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-black border-white/10 text-white"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/user/projects/${project.id}`);
                          }}
                          className="hover:bg-white/5 cursor-pointer"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/user/projects/${project.id}/edit`);
                          }}
                          className="hover:bg-white/5 cursor-pointer"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/user/projects/${project.id}/github`);
                          }}
                          className="hover:bg-white/5 cursor-pointer"
                        >
                          <GitBranchIcon className="h-4 w-4 mr-2" />
                          GitHub
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setShowDeleteDialog(true);
                          }}
                          className="hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2Icon className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              All data including builds, downloads, and GitHub integration will be permanently removed.
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
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}