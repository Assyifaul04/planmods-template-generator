// app/user/projects/[id]/edit/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  User,
  Calendar,
  Layers,
  GitBranch,
  Globe,
  Lock,
  Users,
  Edit,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  packageName: string;
  modId: string;
  author: string;
  version: string;
  license: string;
  status: "DRAFT" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  starsCount: number;
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
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
    cloneUrl: string;
    defaultBranch: string;
    private: boolean;
    lastSyncedAt: string | null;
  } | null;
  _count: {
    downloads: number;
    stars: number;
    builds: number;
    collaborators: number;
  };
}

interface MinecraftVersion {
  id: string;
  version: string;
  platform: "JAVA" | "BEDROCK";
  isLatest: boolean;
  isSnapshot: boolean;
}

const LOADER_OPTIONS = {
  JAVA: [
    { id: "FABRIC", name: "Fabric" },
    { id: "FORGE", name: "Forge" },
    { id: "NEOFORGE", name: "NeoForge" },
    { id: "QUILT", name: "Quilt" },
    { id: "PAPER", name: "Paper" },
    { id: "SPIGOT", name: "Spigot" },
    { id: "PURPUR", name: "Purpur" },
    { id: "FOLIA", name: "Folia" },
    { id: "VELOCITY", name: "Velocity" },
    { id: "WATERFALL", name: "Waterfall" },
    { id: "BUNGEECORD", name: "BungeeCord" },
  ],
  BEDROCK: [
    { id: "ADDON", name: "Addon" },
    { id: "SCRIPT", name: "Script API" },
  ],
} as const;

type Platform = "JAVA" | "BEDROCK";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "JAVA" as Platform,
    loader: "FABRIC" as string,
    minecraftVersion: "",
    packageName: "",
    modId: "",
    author: "",
    version: "",
    license: "MIT",
    visibility: "PRIVATE" as "PRIVATE" | "UNLISTED" | "PUBLIC",
    status: "DRAFT" as "DRAFT" | "READY" | "FAILED" | "ARCHIVED",
  });

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchVersions();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/projects/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch project");
      }
      const data = await response.json();
      setProject(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        platform: data.platform,
        loader: data.loader,
        minecraftVersion: data.minecraftVersion,
        packageName: data.packageName,
        modId: data.modId,
        author: data.author,
        version: data.version,
        license: data.license || "MIT",
        visibility: data.visibility,
        status: data.status,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch("/api/user/versions");
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/user/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: slugify(formData.name, { lower: true, strict: true }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update project");
      }

      toast.success("Project updated successfully");
      router.push(`/user/projects/${id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/user/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      router.push("/user/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      DRAFT: { label: "Draft", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Edit },
      GENERATING: { label: "Generating", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: RefreshCw },
      READY: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
      FAILED: { label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
      ARCHIVED: { label: "Archived", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Archive },
    };
    const info = statusMap[status] || statusMap.DRAFT;
    const Icon = info.icon;
    return (
      <Badge className={`${info.className} rounded-full font-medium tracking-tight flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityMap: Record<string, { label: string; icon: any; className: string }> = {
      PRIVATE: { label: "Private", icon: Lock, className: "text-white/60 border-white/20" },
      UNLISTED: { label: "Unlisted", icon: Users, className: "text-white/60 border-white/20" },
      PUBLIC: { label: "Public", icon: Globe, className: "text-white/60 border-white/20" },
    };
    const info = visibilityMap[visibility] || visibilityMap.PRIVATE;
    const Icon = info.icon;
    return (
      <Badge variant="outline" className={`rounded-full ${info.className} font-medium tracking-tight flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  const filteredVersions = versions.filter(
    (v) => v.platform === formData.platform
  );

  // Tambahkan error boundary untuk mencegah crash
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2.5 text-sm text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
          Loading project...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <Package className="h-5 w-5 text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/70">Project not found</p>
          <p className="text-xs text-white/30 mt-0.5">It may have been deleted or moved.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-white hover:bg-white/10 rounded-md"
          onClick={() => router.push("/user/projects")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/user/projects/${id}`)}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-md -ml-2 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Edit Project
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-sm text-white/40 font-mono">{project.slug}</span>
              <span className="text-white/15">/</span>
              {getStatusBadge(project.status)}
              {getVisibilityBadge(project.visibility)}
              <span className="text-white/15">/</span>
              <span className="text-xs text-white/40">
                {project.platform} · {project.loader}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black hover:bg-white/90 rounded-md font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2 text-sm font-medium">
                <Edit className="h-4 w-4 text-white/40" />
                Project Details
              </CardTitle>
              <CardDescription className="text-white/40 text-xs">
                Edit your project information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/90 text-sm">
                  Project Name <span className="text-white/40">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Blaze Sword"
                  className="bg-white/5 border-white/10 text-white h-10 text-sm focus-visible:ring-white/20"
                />
                <p className="text-[11px] text-white/40">
                  Changing the name will update the slug and package name.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-white/90 text-sm">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of your project"
                  className="bg-white/5 border-white/10 text-white h-10 text-sm focus-visible:ring-white/20"
                />
              </div>

              {/* Platform & Loader */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => handleSelectChange("platform", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="JAVA">Java</SelectItem>
                      <SelectItem value="BEDROCK">Bedrock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Loader</Label>
                  <Select
                    value={formData.loader}
                    onValueChange={(value) => handleSelectChange("loader", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      {LOADER_OPTIONS[formData.platform]?.map((loader) => (
                        <SelectItem key={loader.id} value={loader.id}>
                          {loader.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Minecraft Version */}
              <div className="space-y-1.5">
                <Label className="text-white/90 text-sm">Minecraft Version</Label>
                <Select
                  value={formData.minecraftVersion}
                  onValueChange={(value) => handleSelectChange("minecraftVersion", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white max-h-[200px]">
                    {filteredVersions.map((v) => (
                      <SelectItem key={v.id} value={v.version}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{v.version}</span>
                          {v.isLatest && (
                            <Badge className="bg-white text-black border-white text-[10px]">
                              Latest
                            </Badge>
                          )}
                          {v.isSnapshot && (
                            <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
                              Snapshot
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => handleSelectChange("visibility", value as any)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="UNLISTED">Unlisted</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value as any)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4 text-white/40" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Package className="h-3 w-3" />
                  Package Name
                </Label>
                <Input
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border-white/10 text-white/70 h-9 text-sm font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Layers className="h-3 w-3" />
                  Mod ID
                </Label>
                <Input
                  name="modId"
                  value={formData.modId}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border-white/10 text-white/70 h-9 text-sm font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                  <User className="h-3 w-3" />
                  Author
                </Label>
                <Input
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Calendar className="h-3 w-3" />
                  Version
                </Label>
                <Input
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white h-9 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                  <GitBranch className="h-3 w-3" />
                  License
                </Label>
                <Select
                  value={formData.license}
                  onValueChange={(value) => handleSelectChange("license", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    <SelectItem value="MIT">MIT</SelectItem>
                    <SelectItem value="APACHE-2.0">Apache 2.0</SelectItem>
                    <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                    <SelectItem value="LGPL-3.0">LGPL 3.0</SelectItem>
                    <SelectItem value="BSD-3-Clause">BSD 3-Clause</SelectItem>
                    <SelectItem value="MPL-2.0">MPL 2.0</SelectItem>
                    <SelectItem value="UNLICENSED">Unlicensed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Info */}
          {project.githubRepository && (
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-white flex items-center gap-2 text-sm font-medium">
                  <GitBranch className="h-4 w-4 text-white/40" />
                  GitHub Repository
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="text-white/40">Name:</span>
                  <span className="text-white/80 font-mono">{project.githubRepository.repositoryName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="text-white/40">Branch:</span>
                  <span className="text-white/80 font-mono">{project.githubRepository.defaultBranch}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="text-white/40">Private:</span>
                  <span className={project.githubRepository.private ? "text-yellow-400" : "text-green-400"}>
                    {project.githubRepository.private ? "Yes" : "No"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/10 text-white hover:bg-white/10 text-xs"
                  onClick={() => window.open(project.githubRepository?.repositoryUrl, "_blank")}
                >
                  <Globe className="h-3.5 w-3.5 mr-2" />
                  View on GitHub
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!deleting) setShowDeleteDialog(open);
      }}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete <span className="text-white font-medium">"{project.name}"</span>?
              <br /><br />
              This action <span className="text-red-400 font-medium">cannot be undone</span>.
              All project data including files, downloads, builds, and collaborators will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}