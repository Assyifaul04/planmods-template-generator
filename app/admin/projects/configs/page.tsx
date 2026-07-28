// app/admin/projects/configs/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectConfig {
  id: string;
  projectId: string;
  loaderVersion: string | null;
  fabricApiVersion: string | null;
  loomVersion: string | null;
  javaVersion: string | null;
  gradleVersion: string | null;
  yarnVersion: string | null;
  mappingVersion: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    slug: string;
    platform: string;
    loader: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// ✅ Type untuk config fields
type ConfigFieldKey = keyof Omit<ProjectConfig, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'project'>;

const configFields: { key: ConfigFieldKey; label: string }[] = [
  { key: "loaderVersion", label: "Loader Version" },
  { key: "fabricApiVersion", label: "Fabric API Version" },
  { key: "loomVersion", label: "Loom Version" },
  { key: "javaVersion", label: "Java Version" },
  { key: "gradleVersion", label: "Gradle Version" },
  { key: "yarnVersion", label: "Yarn Version" },
  { key: "mappingVersion", label: "Mapping Version" },
];

// ✅ Component dengan useSearchParams dibungkus Suspense
function ProjectConfigsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [configs, setConfigs] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProjectConfig>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSingleView = !!projectId;

  useEffect(() => {
    if (isSingleView) {
      fetchConfig();
    } else {
      fetchConfigs();
    }
  }, [projectId, page, search]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}/config`);
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching project config:", error);
      toast.error("Failed to fetch project config");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/projects/configs?page=${page}&limit=20&search=${encodeURIComponent(search)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch configs");
      }
      const data = await response.json();
      setConfigs(data.configs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching project configs:", error);
      toast.error("Failed to fetch project configs");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: ProjectConfig) => {
    setEditForm(config);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.projectId) return;

    try {
      const response = await fetch(`/api/admin/projects/${editForm.projectId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update config");
      }

      toast.success("Configuration updated successfully");
      setEditing(false);
      if (isSingleView) {
        fetchConfig();
      } else {
        fetchConfigs();
      }
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update config");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/projects/${deleteId}/config`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete config");
      }

      toast.success("Configuration deleted successfully");
      setShowDeleteDialog(false);
      setDeleteId(null);
      if (isSingleView) {
        setConfig(null);
      } else {
        fetchConfigs();
      }
    } catch (error) {
      console.error("Error deleting config:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete config");
    }
  };

  // ✅ Helper function untuk mendapatkan nilai config dengan aman
  const getConfigValue = (field: ConfigFieldKey): string | null => {
    if (!config) return null;
    return config[field] as string | null;
  };

  if (isSingleView) {
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
            <h2 className="text-2xl font-semibold text-white">Project Configuration</h2>
            <p className="text-sm text-white/60 mt-1">
              Configuration details for project {projectId?.slice(0, 8) || ""}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {config && config.id && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(config)}
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(config.projectId)}
                  className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60 font-medium">Setting</TableHead>
                <TableHead className="text-white/60 font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-white/40">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                      Loading configuration...
                    </div>
                  </TableCell>
                </TableRow>
              ) : config && config.id ? (
                <>
                  {configFields.map((field) => {
                    const value = getConfigValue(field.key);
                    return (
                      <TableRow key={field.key} className="border-white/10 hover:bg-transparent">
                        <TableCell className="text-white/60">{field.label}</TableCell>
                        <TableCell className="text-white">
                          {value || <span className="text-white/30">Not set</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell className="text-white/60">Created</TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(config.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell className="text-white/60">Last Updated</TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(config.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-white/40">
                    <div className="flex flex-col items-center gap-2">
                      <Settings className="h-12 w-12 text-white/20" />
                      <p>No configuration found for this project</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Configuration</DialogTitle>
              <DialogDescription className="text-white/40">
                Update the configuration values for this project
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {configFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm text-white/60">{field.label}</label>
                  <Input
                    value={editForm[field.key] || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value || null,
                      }))
                    }
                    placeholder={`Enter ${field.label}`}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-white text-black hover:bg-white/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-black border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Configuration</DialogTitle>
              <DialogDescription className="text-white/60">
                Are you sure you want to delete this configuration? This action cannot be undone.
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
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Project Configurations</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all project configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-white/5 border-white/10 text-white w-48"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConfigs}
              className="text-white/40 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Loader</TableHead>
              <TableHead className="text-white/60 font-medium">Loader Version</TableHead>
              <TableHead className="text-white/60 font-medium">Java</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    Loading configurations...
                  </div>
                </TableCell>
              </TableRow>
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Settings className="h-12 w-12 text-white/20" />
                    <p>No configurations found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              configs.map((cfg) => (
                <TableRow key={cfg.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{cfg.project?.name || "Unknown"}</p>
                      <p className="text-xs text-white/30">{cfg.project?.slug || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">{cfg.project?.platform || "-"}</TableCell>
                  <TableCell className="text-white/60">{cfg.project?.loader || "-"}</TableCell>
                  <TableCell className="text-white font-mono text-sm">
                    {cfg.loaderVersion || <span className="text-white/30">-</span>}
                  </TableCell>
                  <TableCell className="text-white font-mono text-sm">
                    {cfg.javaVersion || <span className="text-white/30">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`border-none ${
                        cfg.project?.status === "READY"
                          ? "text-emerald-400"
                          : cfg.project?.status === "FAILED"
                          ? "text-red-400"
                          : "text-white/40"
                      }`}
                    >
                      {cfg.project?.status || "DRAFT"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/projects/configs?projectId=${cfg.projectId}`)}
                        className="text-white/40 hover:text-white hover:bg-white/10"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cfg)}
                        className="text-white/40 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cfg.projectId)}
                        className="text-red-400/40 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-white/40">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Export dengan Suspense wrapper
export default function ProjectConfigsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    }>
      <ProjectConfigsContent />
    </Suspense>
  );
}