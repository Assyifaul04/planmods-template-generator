// app/admin/tags/page.tsx
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
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Hash,
  Plus,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: {
    templates: number;
  };
}

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [search, page]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      
      const response = await fetch(`/api/admin/tags?${params}`);
      const data = await response.json();
      setTags(data.tags);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/tags/${selectedTag?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tag");
      }

      toast.success("Tag updated successfully");
      setShowEditDialog(false);
      setSelectedTag(null);
      setFormData({ name: "", slug: "" });
      fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update tag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/tags/${selectedTag.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tag");
      }

      toast.success("Tag deleted successfully");
      setShowDeleteDialog(false);
      setSelectedTag(null);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete tag");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({ name: tag.name, slug: tag.slug });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setShowDeleteDialog(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slugify(value, { lower: true, strict: true }),
    }));
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Tags Management</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage all tags used across the platform
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/tags/new")}
          className="bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search tags by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchTags}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/40">Total Tags</div>
          <div className="text-2xl font-bold text-white">{tags.length}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/40">Total Templates</div>
          <div className="text-2xl font-bold text-white">
            {tags.reduce((acc, tag) => acc + tag._count.templates, 0)}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <div className="text-sm text-white/40">Avg Tags per Template</div>
          <div className="text-2xl font-bold text-white">
            {tags.length > 0 ? (tags.reduce((acc, tag) => acc + tag._count.templates, 0) / tags.length).toFixed(1) : "0"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Tag Name</TableHead>
              <TableHead className="text-white/60 font-medium">Slug</TableHead>
              <TableHead className="text-white/60 font-medium">Templates</TableHead>
              <TableHead className="text-white/60 font-medium">Created</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading tags...
                  </div>
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Hash className="h-12 w-12 text-white/20" />
                    <p>No tags found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/tags/new")}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first tag
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-white/30" />
                      <span className="text-white font-medium">{tag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white/40 border-white/10 font-mono">
                      {tag.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/tags/templates?tag=${tag.id}`)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      {tag._count.templates} templates
                    </Button>
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(tag.createdAt).toLocaleDateString()}
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
                          onClick={() => router.push(`/admin/tags/templates?tag=${tag.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Templates
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(tag)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(tag)}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription className="text-white/60">
              Update the tag information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTag}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name" className="text-white">Tag Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Fabric Mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-slug" className="text-white">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., fabric-mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-white text-black hover:bg-white/90">
                {submitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Tag
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{selectedTag?.name}"?
              {selectedTag && selectedTag._count.templates > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This tag is used by {selectedTag._count.templates} templates.
                  Deleting it will remove the tag from those templates.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={handleDeleteTag} disabled={submitting} className="bg-red-500 hover:bg-red-600">
              {submitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tag
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}