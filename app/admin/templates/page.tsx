// app/admin/templates/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Star,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Check,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  path: string;
  repoUrl: string | null;
  gradleUrl: string | null;
  enabled: boolean;
  isFeatured: boolean;
  usageCount: number;
  createdAt: string;
  templateRepo: {
    id: string;
    repoUrl: string;
    platform: string;
    loader: string;
  } | null;
  mcVersionData: {
    version: string;
    platform: string;
    isLatest: boolean;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    projects: number;
  };
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [loaderFilter, setLoaderFilter] = useState<string>("");

  useEffect(() => {
    fetchTemplates();
  }, [search, page, platformFilter, loaderFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(platformFilter && { platform: platformFilter }),
        ...(loaderFilter && { loader: loaderFilter }),
      });
      
      const response = await fetch(`/api/admin/templates?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch templates");
      }
      
      const data = await response.json();
      
      const templatesData = Array.isArray(data.templates) ? data.templates : [];
      
      const validTemplates = templatesData.map((template: any) => ({
        ...template,
        _count: template._count || { projects: 0 },
        tags: Array.isArray(template.tags) ? template.tags : [],
        usageCount: template.usageCount || 0,
        templateRepo: template.templateRepo || null,
        mcVersionData: template.mcVersionData || null,
      }));
      
      setTemplates(validTemplates);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("❌ Error fetching templates:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch templates");
      toast.error(error instanceof Error ? error.message : "Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (templateId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update featured status");
      }

      toast.success(`Template ${isFeatured ? "featured" : "unfeatured"} successfully`);
      fetchTemplates();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update featured status");
    }
  };

  const handleToggleEnabled = async (templateId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/enable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update enabled status");
      }

      toast.success(`Template ${enabled ? "enabled" : "disabled"} successfully`);
      fetchTemplates();
    } catch (error) {
      console.error("Error updating enabled status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update enabled status");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      toast.success("Template deleted successfully");
      fetchTemplates();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete template");
    }
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === "JAVA") {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Java</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bedrock</Badge>;
  };

  const getLoaderColor = (loader: string) => {
    const colors: Record<string, string> = {
      FABRIC: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      FORGE: "bg-red-500/20 text-red-400 border-red-500/30",
      NEOFORGE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      QUILT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PAPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      SPIGOT: "bg-green-500/20 text-green-400 border-green-500/30",
      ADDON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      SCRIPT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return colors[loader] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <Package className="h-5 w-5 text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/70">Error loading templates</p>
          <p className="text-xs text-white/40 mt-1">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-white hover:bg-white/10"
          onClick={fetchTemplates}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Templates Management</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all templates and their configurations
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/templates/new")}
          className="bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

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

        <Select value={loaderFilter} onValueChange={setLoaderFilter}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Loaders" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Loaders</SelectItem>
            <SelectItem value="FABRIC">Fabric</SelectItem>
            <SelectItem value="FORGE">Forge</SelectItem>
            <SelectItem value="NEOFORGE">NeoForge</SelectItem>
            <SelectItem value="PAPER">Paper</SelectItem>
            <SelectItem value="ADDON">Addon</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchTemplates}
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
              <TableHead className="text-white/60 font-medium">Template</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Loader</TableHead>
              <TableHead className="text-white/60 font-medium">MC Version</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Featured</TableHead>
              <TableHead className="text-white/60 font-medium">Usage</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading templates...
                  </div>
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-white/20" />
                    <p>No templates found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/templates/new")}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first template
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10">
                        {template.thumbnailUrl ? (
                          <Image
                            src={template.thumbnailUrl}
                            alt={template.name}
                            width={40}
                            height={40}
                            className="object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <Package className="h-5 w-5 text-white/20" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{template.name}</div>
                        <div className="text-xs text-white/40">{template.slug}</div>
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {template.tags.slice(0, 2).map((t) => (
                              <Badge key={t.tag.id} variant="outline" className="text-[10px] text-white/40 border-white/10">
                                {t.tag.name}
                              </Badge>
                            ))}
                            {template.tags.length > 2 && (
                              <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                                +{template.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlatformBadge(template.platform)}</TableCell>
                  <TableCell>
                    <Badge className={getLoaderColor(template.loader)}>
                      {template.loader}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">{template.minecraftVersion}</TableCell>
                  <TableCell>
                    <Badge className={template.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {template.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(template.id, !template.isFeatured)}
                      className={template.isFeatured ? "text-yellow-400 hover:text-yellow-300" : "text-white/40 hover:text-white/60"}
                    >
                      <Star className={`h-4 w-4 ${template.isFeatured ? "fill-yellow-400" : ""}`} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white/60">{template.usageCount} uses</div>
                    <div className="text-xs text-white/30">{template._count?.projects || 0} projects</div>
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
                          onClick={() => router.push(`/admin/templates/${template.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/templates/${template.id}/edit`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {template.repoUrl && (
                          <DropdownMenuItem
                            onClick={() => window.open(template.repoUrl!, "_blank")}
                            className="hover:bg-white/10 cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Repository
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleToggleEnabled(template.id, !template.enabled)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          {template.enabled ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTemplate(template);
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
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
              {selectedTemplate && selectedTemplate._count && selectedTemplate._count.projects > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This template is used by {selectedTemplate._count.projects} projects.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={() => handleDeleteTemplate(selectedTemplate?.id!)} className="bg-red-500 hover:bg-red-600">
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}