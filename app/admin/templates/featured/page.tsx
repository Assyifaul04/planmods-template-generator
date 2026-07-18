// app/admin/templates/featured/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Search,
  Star,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Eye,
  Package,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface FeaturedTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  isFeatured: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
  };
}

export default function FeaturedTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FeaturedTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<FeaturedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeaturedTemplates();
    fetchAllTemplates();
  }, [search, page]);

  const fetchFeaturedTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        isFeatured: "true",
      });
      
      const response = await fetch(`/api/admin/templates?${params}`);
      const data = await response.json();
      setTemplates(data.templates);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching featured templates:", error);
      toast.error("Failed to fetch featured templates");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTemplates = async () => {
    try {
      const response = await fetch("/api/admin/templates?limit=100&isFeatured=false");
      const data = await response.json();
      setAllTemplates(data.templates);
    } catch (error) {
      console.error("Error fetching all templates:", error);
    }
  };

  const handleToggleFeatured = async (templateId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });

      if (!response.ok) throw new Error("Failed to update featured status");

      toast.success(`Template ${isFeatured ? "featured" : "unfeatured"} successfully`);
      fetchFeaturedTemplates();
      fetchAllTemplates();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update featured status");
    }
  };

  const handleAddFeatured = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    setSubmitting(true);
    try {
      await handleToggleFeatured(selectedTemplate, true);
      setShowAddDialog(false);
      setSelectedTemplate("");
    } finally {
      setSubmitting(false);
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
      PAPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[loader] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/templates")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Featured Templates</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage templates that appear on the featured section
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="ml-auto bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
        >
          <Star className="h-4 w-4 mr-2 fill-yellow-400" />
          Add Featured
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Star className="h-4 w-4 text-yellow-400" />
            Featured Templates
          </div>
          <div className="text-2xl font-bold text-white">{templates.length}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Package className="h-4 w-4 text-blue-400" />
            Total Templates
          </div>
          <div className="text-2xl font-bold text-white">
            {templates.length + allTemplates.length}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Total Usage
          </div>
          <div className="text-2xl font-bold text-white">
            {templates.reduce((acc, t) => acc + t.usageCount, 0)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Featured % of Total
          </div>
          <div className="text-2xl font-bold text-white">
            {templates.length + allTemplates.length > 0
              ? ((templates.length / (templates.length + allTemplates.length)) * 100).toFixed(0)
              : "0"}%
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search featured templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchFeaturedTemplates();
            fetchAllTemplates();
          }}
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
              <TableHead className="text-white/60 font-medium">Usage</TableHead>
              <TableHead className="text-white/60 font-medium">Added</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading featured templates...
                  </div>
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Star className="h-12 w-12 text-white/20" />
                    <p>No featured templates yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDialog(true)}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Add your first featured template
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
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <Package className="h-5 w-5 text-white/20" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{template.name}</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                            Featured
                          </Badge>
                        </div>
                        <div className="text-xs text-white/40">{template.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlatformBadge(template.platform)}</TableCell>
                  <TableCell>
                    <Badge className={getLoaderColor(template.loader)}>
                      {template.loader}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white/60">
                      {template.usageCount} uses
                    </div>
                    <div className="text-xs text-white/30">
                      {template._count.projects} projects
                    </div>
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/templates/${template.id}`)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(template.id, false)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      >
                        <Star className="h-4 w-4" />
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

      {/* Add Featured Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              Add Featured Template
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Select a template to feature on the homepage
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-white">Select Template *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white max-h-[300px]">
                    {allTemplates.length === 0 ? (
                      <SelectItem value="no-templates" disabled>
                        No templates available
                      </SelectItem>
                    ) : (
                      allTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            <Badge variant="outline" className="text-white/40 border-white/10 text-[10px]">
                              {template.platform}
                            </Badge>
                            <Badge variant="outline" className="text-white/40 border-white/10 text-[10px]">
                              {template.loader}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/40 mt-1">
                  {allTemplates.length} templates available to feature
                </p>
              </div>

              {selectedTemplate && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    {allTemplates.find(t => t.id === selectedTemplate)?.thumbnailUrl && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10">
                        <Image
                          src={allTemplates.find(t => t.id === selectedTemplate)?.thumbnailUrl || ""}
                          alt="Template thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-white font-medium">
                        {allTemplates.find(t => t.id === selectedTemplate)?.name}
                      </div>
                      <div className="text-xs text-white/40">
                        {allTemplates.find(t => t.id === selectedTemplate)?.description}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedTemplate("");
              }}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFeatured}
              disabled={!selectedTemplate || submitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                  Adding...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2 fill-yellow-400" />
                  Add to Featured
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}