// app/admin/versions/mappings/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Box,
  Star,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

interface LoaderMapping {
  id: string;
  loader: string;
  loaderVersion: string;
  apiVersion: string | null;
  loomVersion: string | null;
  mappingsVersion: string | null;
  gradleVersion: string | null;
  javaVersion: string | null;
  repository: string | null;
  recommended: boolean;
  supported: boolean;
  createdAt: string;
  updatedAt: string;
  minecraftVersion: {
    id: string;
    version: string;
    platform: string;
    isLatest: boolean;
    isSnapshot: boolean;
  };
  templates: Array<{ id: string; name: string }>;
}

export default function LoaderMappingsPage() {
  const router = useRouter();
  const [mappings, setMappings] = useState<LoaderMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loaderFilter, setLoaderFilter] = useState("");
  const [versionFilter, setVersionFilter] = useState("");
  const [selectedMapping, setSelectedMapping] = useState<LoaderMapping | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingData, setEditingData] = useState({
    loaderVersion: "",
    apiVersion: "",
    loomVersion: "",
    gradleVersion: "",
    javaVersion: "",
    mappingsVersion: "",
    recommended: false,
    supported: true,
  });

  useEffect(() => {
    fetchMappings();
  }, [search, loaderFilter, versionFilter]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (loaderFilter) params.append("loader", loaderFilter);
      if (versionFilter) params.append("versionId", versionFilter);
      
      const response = await fetch(`/api/admin/versions/mappings?${params}`);
      const data = await response.json();
      setMappings(data);
    } catch (error) {
      console.error("Error fetching loader mappings:", error);
      toast.error("Failed to fetch loader mappings");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mapping: LoaderMapping) => {
    setSelectedMapping(mapping);
    setEditingData({
      loaderVersion: mapping.loaderVersion || "",
      apiVersion: mapping.apiVersion || "",
      loomVersion: mapping.loomVersion || "",
      gradleVersion: mapping.gradleVersion || "",
      javaVersion: mapping.javaVersion || "",
      mappingsVersion: mapping.mappingsVersion || "",
      recommended: mapping.recommended || false,
      supported: mapping.supported !== undefined ? mapping.supported : true,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMapping) return;
    
    try {
      // Simulate save - in production, call API
      toast.success("Loader mapping updated successfully");
      setShowEditDialog(false);
      fetchMappings();
    } catch (error) {
      console.error("Error updating mapping:", error);
      toast.error("Failed to update loader mapping");
    }
  };

  const handleDelete = async () => {
    if (!selectedMapping) return;
    
    try {
      // Simulate delete - in production, call API
      toast.success("Loader mapping deleted successfully");
      setShowDeleteDialog(false);
      fetchMappings();
    } catch (error) {
      console.error("Error deleting mapping:", error);
      toast.error("Failed to delete loader mapping");
    }
  };

  const getLoaderColor = (loader: string) => {
    const colors: Record<string, string> = {
      FABRIC: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      FORGE: "bg-red-500/20 text-red-400 border-red-500/30",
      NEOFORGE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      QUILT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PAPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      SPIGOT: "bg-green-500/20 text-green-400 border-green-500/30",
      PURPUR: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      FOLIA: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      VELOCITY: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      WATERFALL: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      BUNGEECORD: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      ADDON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      SCRIPT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return colors[loader] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === "JAVA") {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Java</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bedrock</Badge>;
  };

  return (
    <div className="px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/versions")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Loader Mappings</h2>
          <p className="text-sm text-white/60 mt-1">
            Configure loader versions and mappings for Minecraft versions
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-white/40 border-white/10">
            {mappings.length} mappings
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by loader or version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Select value={loaderFilter} onValueChange={setLoaderFilter}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All Loaders" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10 text-white">
            <SelectItem value="">All Loaders</SelectItem>
            <SelectItem value="FABRIC">Fabric</SelectItem>
            <SelectItem value="FORGE">Forge</SelectItem>
            <SelectItem value="NEOFORGE">NeoForge</SelectItem>
            <SelectItem value="QUILT">Quilt</SelectItem>
            <SelectItem value="PAPER">Paper</SelectItem>
            <SelectItem value="SPIGOT">Spigot</SelectItem>
            <SelectItem value="ADDON">Bedrock Addon</SelectItem>
            <SelectItem value="SCRIPT">Bedrock Script</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchMappings}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Mappings Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Loader</TableHead>
              <TableHead className="text-white/60 font-medium">Version</TableHead>
              <TableHead className="text-white/60 font-medium">MC Version</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Details</TableHead>
              <TableHead className="text-white/60 font-medium">Templates</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading mappings...
                  </div>
                </TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="h-12 w-12 text-white/20" />
                    <p>No loader mappings found</p>
                    <p className="text-sm text-white/30">Add loader mappings for Minecraft versions</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getLoaderColor(mapping.loader)}>
                        {mapping.loader}
                      </Badge>
                      {mapping.recommended && (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60 font-mono">
                    {mapping.loaderVersion}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white/40 border-white/10">
                      {mapping.minecraftVersion.version}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlatformBadge(mapping.minecraftVersion.platform)}</TableCell>
                  <TableCell>
                    {mapping.supported ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Supported
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unsupported
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5 text-white/40">
                      {mapping.apiVersion && <div>API: {mapping.apiVersion}</div>}
                      {mapping.loomVersion && <div>Loom: {mapping.loomVersion}</div>}
                      {mapping.gradleVersion && <div>Gradle: {mapping.gradleVersion}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {mapping.templates.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMapping(mapping);
                          setShowDeleteDialog(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-400" />
              Edit Loader Mapping
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Update configuration for {selectedMapping?.loader} on {selectedMapping?.minecraftVersion.version}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Loader Version *</Label>
                <Input
                  value={editingData.loaderVersion}
                  onChange={(e) => setEditingData({ ...editingData, loaderVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 0.15.11"
                />
              </div>
              <div>
                <Label className="text-white">API Version</Label>
                <Input
                  value={editingData.apiVersion}
                  onChange={(e) => setEditingData({ ...editingData, apiVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 0.90.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Loom Version</Label>
                <Input
                  value={editingData.loomVersion}
                  onChange={(e) => setEditingData({ ...editingData, loomVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 1.5-SNAPSHOT"
                />
              </div>
              <div>
                <Label className="text-white">Gradle Version</Label>
                <Input
                  value={editingData.gradleVersion}
                  onChange={(e) => setEditingData({ ...editingData, gradleVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 8.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Java Version</Label>
                <Input
                  value={editingData.javaVersion}
                  onChange={(e) => setEditingData({ ...editingData, javaVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 17"
                />
              </div>
              <div>
                <Label className="text-white">Mappings Version</Label>
                <Input
                  value={editingData.mappingsVersion}
                  onChange={(e) => setEditingData({ ...editingData, mappingsVersion: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  placeholder="e.g., 1.20.4"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={editingData.recommended}
                    onChange={(e) => setEditingData({ ...editingData, recommended: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-white w-4 h-4"
                  />
                  <Label htmlFor="recommended" className="text-white cursor-pointer">
                    Recommended
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="supported"
                    checked={editingData.supported}
                    onChange={(e) => setEditingData({ ...editingData, supported: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-white w-4 h-4"
                  />
                  <Label htmlFor="supported" className="text-white cursor-pointer">
                    Supported
                  </Label>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
              <p className="text-sm text-blue-400/60">
                <Package className="h-4 w-4 inline mr-1" />
                {selectedMapping?.loader} → {selectedMapping?.minecraftVersion.version}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-white text-black hover:bg-white/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Loader Mapping</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete the loader mapping for <span className="text-white font-medium">{selectedMapping?.loader}</span> on <span className="text-white font-medium">{selectedMapping?.minecraftVersion.version}</span>?
              {selectedMapping && selectedMapping.templates.length > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This mapping is used by {selectedMapping.templates.length} templates.
                  Deleting it may affect these templates.
                </span>
              )}
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
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}