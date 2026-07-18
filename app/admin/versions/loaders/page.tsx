// app/admin/versions/loaders/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { ArrowLeft, RefreshCw, Search, Box, Star, Plus, Trash2, Edit } from "lucide-react";
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
  minecraftVersion: {
    id: string;
    version: string;
    platform: string;
  };
  templates: Array<{ id: string; name: string }>;
}

export default function LoadersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loaders, setLoaders] = useState<LoaderMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loaderFilter, setLoaderFilter] = useState("");
  const [selectedLoader, setSelectedLoader] = useState<LoaderMapping | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchLoaders();
  }, [search, loaderFilter]);

  const fetchLoaders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (loaderFilter) params.append("loader", loaderFilter);
      
      const response = await fetch(`/api/admin/versions/mappings?${params}`);
      const data = await response.json();
      setLoaders(data);
    } catch (error) {
      console.error("Error fetching loaders:", error);
      toast.error("Failed to fetch loaders");
    } finally {
      setLoading(false);
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

  return (
    <div className="px-4 lg:px-6">
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
            Manage loader configurations for Minecraft versions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search loaders..."
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
            <SelectItem value="BEDROCK_ADDON">Bedrock Addon</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchLoaders}
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
              <TableHead className="text-white/60 font-medium">Loader</TableHead>
              <TableHead className="text-white/60 font-medium">Version</TableHead>
              <TableHead className="text-white/60 font-medium">MC Version</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Templates</TableHead>
              <TableHead className="text-white/60 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading loaders...
                  </div>
                </TableCell>
              </TableRow>
            ) : loaders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Box className="h-12 w-12 text-white/20" />
                    <p>No loader mappings found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              loaders.map((loader) => (
                <TableRow key={loader.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <Badge className={getLoaderColor(loader.loader)}>
                      {loader.loader}
                      {loader.recommended && (
                        <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60">{loader.loaderVersion}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white/40 border-white/10">
                      {loader.minecraftVersion.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {loader.supported ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Supported</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Unsupported</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">{loader.templates.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLoader(loader);
                          setShowEditDialog(true);
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLoader(loader);
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Loader Mapping</DialogTitle>
            <DialogDescription className="text-white/60">
              Update configuration for {selectedLoader?.loader} on {selectedLoader?.minecraftVersion.version}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Loader Version</Label>
                <Input
                  value={selectedLoader?.loaderVersion || ""}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, loaderVersion: e.target.value } : null)}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                />
              </div>
              <div>
                <Label className="text-white">API Version</Label>
                <Input
                  value={selectedLoader?.apiVersion || ""}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, apiVersion: e.target.value } : null)}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Loom Version</Label>
                <Input
                  value={selectedLoader?.loomVersion || ""}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, loomVersion: e.target.value } : null)}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                />
              </div>
              <div>
                <Label className="text-white">Gradle Version</Label>
                <Input
                  value={selectedLoader?.gradleVersion || ""}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, gradleVersion: e.target.value } : null)}
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLoader?.recommended || false}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, recommended: e.target.checked } : null)}
                  className="rounded border-white/20 bg-black/40 text-white"
                />
                <Label className="text-white cursor-pointer">Recommended</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLoader?.supported || false}
                  onChange={(e) => setSelectedLoader(prev => prev ? { ...prev, supported: e.target.checked } : null)}
                  className="rounded border-white/20 bg-black/40 text-white"
                />
                <Label className="text-white cursor-pointer">Supported</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Loader mapping updated");
              setShowEditDialog(false);
              fetchLoaders();
            }} className="bg-white text-black hover:bg-white/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Loader Mapping</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete the loader mapping for {selectedLoader?.loader} on {selectedLoader?.minecraftVersion.version}?
              {selectedLoader && selectedLoader.templates.length > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This mapping is used by {selectedLoader.templates.length} templates.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Loader mapping deleted");
              setShowDeleteDialog(false);
              fetchLoaders();
            }} className="bg-red-500 hover:bg-red-600">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}