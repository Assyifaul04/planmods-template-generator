// app/admin/templates/new/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  GitBranch,
  Info,
  FolderOpen,
  AlertTriangle,
  Terminal,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  ChevronDown,
  Hammer,
} from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TemplateRepo {
  id: string;
  repoUrl: string;
  platform: string;
  loader: string;
}

interface MinecraftVersion {
  id: string;
  version: string;
  platform: "JAVA" | "BEDROCK";
  isLatest: boolean;
  isSnapshot: boolean;
}

interface LoaderMinecraftVersion {
  id: string;
  loader: string;
  loaderVersion: string;
  minecraftVersion: {
    id: string;
    version: string;
  };
  recommended: boolean;
  supported: boolean;
}

const LOADER_OPTIONS = {
  JAVA: [
    "FABRIC",
    "FORGE",
    "NEOFORGE",
    "QUILT",
    "PAPER",
    "SPIGOT",
    "PURPUR",
    "FOLIA",
    "VELOCITY",
    "WATERFALL",
    "BUNGEECORD",
  ],
  BEDROCK: ["ADDON", "SCRIPT"],
} as const;

const LOADER_DISPLAY_NAMES: Record<string, string> = {
  FABRIC: "Fabric",
  FORGE: "Forge",
  NEOFORGE: "NeoForge",
  QUILT: "Quilt",
  PAPER: "Paper",
  SPIGOT: "Spigot",
  PURPUR: "Purpur",
  FOLIA: "Folia",
  VELOCITY: "Velocity",
  WATERFALL: "Waterfall",
  BUNGEECORD: "BungeeCord",
  ADDON: "Bedrock Addon",
  SCRIPT: "Bedrock Script",
};

const DEFAULT_LOADER_VERSIONS: Record<string, string> = {
  FABRIC: "0.16.9",
  FORGE: "52.0.0",
  NEOFORGE: "21.1.100-beta",
  QUILT: "0.25.0",
  PAPER: "1.21.3-R0.1-SNAPSHOT",
  SPIGOT: "1.21.3-R0.1-SNAPSHOT",
  PURPUR: "1.21.3",
  FOLIA: "1.21.3",
  VELOCITY: "3.3.0-SNAPSHOT",
  WATERFALL: "1.21",
  BUNGEECORD: "1.21",
  ADDON: "1.0.0",
  SCRIPT: "1.0.0",
};

// ✅ Loader yang didukung untuk generate template langsung (tanpa clone)
const SUPPORTED_GENERATE_LOADERS = new Set([
  "FABRIC",
  "FORGE",
  "NEOFORGE",
  "QUILT",
]);

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [repos, setRepos] = useState<TemplateRepo[]>([]);
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [loaderVersions, setLoaderVersions] = useState<
    LoaderMinecraftVersion[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [cloneStatus, setCloneStatus] = useState<{
    status: "idle" | "processing" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  const [cloneLogs, setCloneLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    thumbnailUrl: "",
    platform: "JAVA" as "JAVA" | "BEDROCK",
    loader: "FABRIC" as string,
    minecraftVersion: "",
    path: "",
    templateRepoId: "",
    repoUrl: "",
    gradleUrl: "",
    enabled: true,
    isFeatured: false,
    loaderMinecraftVersionId: "",
  });

  const filteredVersions = useMemo(
    () => versions.filter((v) => v.platform === formData.platform),
    [versions, formData.platform],
  );

  const filteredLoaderVersions = useMemo(
    () => loaderVersions.filter((lv) => lv.loader === formData.loader),
    [loaderVersions, formData.loader],
  );

  const loaders = useMemo(
    () =>
      LOADER_OPTIONS[formData.platform as keyof typeof LOADER_OPTIONS] || [],
    [formData.platform],
  );

  // ✅ Cek apakah loader support generate
  const canGenerateTemplate = useMemo(() => {
    return SUPPORTED_GENERATE_LOADERS.has(formData.loader);
  }, [formData.loader]);

  // ✅ Dapatkan display name loader
  const loaderDisplayName = useMemo(() => {
    return LOADER_DISPLAY_NAMES[formData.loader] || formData.loader;
  }, [formData.loader]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchTags(), fetchRepos(), fetchVersions()]);
      } catch (error) {
        console.error("Error initializing page:", error);
      }
    };
    init();
  }, []);

  // Fetch loader versions when loader or minecraftVersion changes
  useEffect(() => {
    if (formData.loader && formData.minecraftVersion) {
      fetchLoaderVersions();
    } else {
      setLoaderVersions([]);
    }
  }, [formData.loader, formData.minecraftVersion]);

  // Auto-generate path
  useEffect(() => {
    if (formData.platform && formData.loader && formData.minecraftVersion) {
      const platformLower = formData.platform.toLowerCase();
      const loaderLower = formData.loader.toLowerCase();
      const path = `public/templates/${platformLower}/${loaderLower}/${formData.minecraftVersion}`;
      setFormData((prev) => ({ ...prev, path }));
    }
  }, [formData.platform, formData.loader, formData.minecraftVersion]);

  // Auto-scroll log panel to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [cloneLogs]);

  // Check if slug is unique
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug || formData.slug.length < 3) {
        setSlugError(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/admin/templates/check-slug?slug=${encodeURIComponent(formData.slug)}`,
        );
        const data = await response.json();
        if (data.exists) {
          setSlugError(
            `Slug "${formData.slug}" is already taken. Please use a different one.`,
          );
        } else {
          setSlugError(null);
        }
      } catch (error) {
        console.error("Error checking slug:", error);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const debounce = setTimeout(checkSlug, 500);
    return () => clearTimeout(debounce);
  }, [formData.slug]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tags?limit=100");
      if (!response.ok) {
        console.error("Failed to fetch tags:", response.status);
        return;
      }
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, []);

  const fetchRepos = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/templates/repos?limit=100");
      if (!response.ok) {
        console.error("Failed to fetch repos:", response.status);
        return;
      }
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/versions?limit=100");
      if (!response.ok) {
        console.error("Failed to fetch versions:", response.status);
        return;
      }
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  }, []);

  const autoCreateLoader = useCallback(
    async (version: MinecraftVersion) => {
      try {
        const response = await fetch("/api/admin/versions/loaders/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minecraftVersion: formData.minecraftVersion,
            loaders: [
              {
                loader: formData.loader,
                loaderVersion:
                  DEFAULT_LOADER_VERSIONS[formData.loader] || "latest",
                recommended: version.isLatest || false,
                supported: true,
              },
            ],
          }),
        });

        if (response.ok) {
          toast.success(
            `Auto-created loader mapping for ${formData.loader} on ${formData.minecraftVersion}`,
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error auto-creating loader:", error);
        return false;
      }
    },
    [formData.loader, formData.minecraftVersion],
  );

  const fetchLoaderVersions = useCallback(async () => {
    if (!formData.loader || !formData.minecraftVersion) return;

    setLoadingLoaders(true);
    try {
      const version = versions.find(
        (v) => v.version === formData.minecraftVersion,
      );
      if (!version) {
        setLoaderVersions([]);
        return;
      }

      const params = new URLSearchParams({
        loader: formData.loader,
        versionId: version.id,
      });

      const response = await fetch(
        `/api/admin/versions/mappings?${params.toString()}`,
      );

      if (!response.ok) {
        console.error("Failed to fetch loader mappings:", response.status);
        setLoaderVersions([]);
        return;
      }

      let data = await response.json();

      if (data.length === 0) {
        const result = await autoCreateLoader(version);
        if (result) {
          const refetchResponse = await fetch(
            `/api/admin/versions/mappings?${params.toString()}`,
          );
          data = await refetchResponse.json();
        }
      }

      setLoaderVersions(data || []);
    } catch (error) {
      console.error("Error fetching loader versions:", error);
      setLoaderVersions([]);
    } finally {
      setLoadingLoaders(false);
    }
  }, [formData.loader, formData.minecraftVersion, versions, autoCreateLoader]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      const slug = slugify(value, { lower: true, strict: true });
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "platform") {
        updated.loader = "";
        updated.minecraftVersion = "";
        setLoaderVersions([]);
      }
      if (name === "loader" || name === "minecraftVersion") {
        updated.loaderMinecraftVersionId = "";
      }
      return updated;
    });
  }, []);

  const handleSwitchChange = useCallback((name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  }, []);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setUploadingImage(true);

      try {
        const formDataImage = new FormData();
        formDataImage.append("file", file);
        formDataImage.append("folder", "templates");

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataImage,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          thumbnailUrl: data.url,
        }));
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
        );
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      thumbnailUrl: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ============================================
  // ✅ FUNGSI CREATE TEMPLATE - OTOMATIS
  // ============================================
  const handleCreateTemplate = useCallback(async () => {
    // Validasi dasar
    if (!formData.name || !formData.minecraftVersion || !formData.platform || !formData.loader) {
      toast.error("Please fill in all required fields");
      return;
    }

    // ✅ Tentukan metode berdasarkan ada/tidaknya repoUrl
    const type = formData.repoUrl ? "clone" : "generate";

    if (type === "clone" && !formData.repoUrl) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    if (type === "generate" && !canGenerateTemplate) {
      toast.error(`Generate template for ${loaderDisplayName} is not supported yet. Please use Clone from GitHub.`);
      return;
    }

    setIsProcessing(true);
    setCloneLogs([]);
    setCloneStatus({ 
      status: "processing", 
      message: type === "clone" ? "Cloning and processing repository..." : `Creating ${loaderDisplayName} template...` 
    });

    try {
      // ✅ Pilih endpoint berdasarkan metode
      const endpoint = type === "clone" 
        ? "/api/admin/templates/clone" 
        : `/api/admin/templates/create-${formData.loader.toLowerCase()}`;

      const body = type === "clone" 
        ? {
            repoUrl: formData.repoUrl,
            templateName: formData.name,
            platform: formData.platform,
            loader: formData.loader,
            minecraftVersion: formData.minecraftVersion,
            loaderVersion: formData.loaderMinecraftVersionId 
              ? loaderVersions.find(lv => lv.id === formData.loaderMinecraftVersionId)?.loaderVersion 
              : DEFAULT_LOADER_VERSIONS[formData.loader] || "latest",
          }
        : {
            templateName: formData.name,
            minecraftVersion: formData.minecraftVersion,
            loaderVersion: formData.loaderMinecraftVersionId 
              ? loaderVersions.find(lv => lv.id === formData.loaderMinecraftVersionId)?.loaderVersion 
              : DEFAULT_LOADER_VERSIONS[formData.loader] || "latest",
            platform: formData.platform,
            loader: formData.loader,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({})) as any;
        throw new Error(error.error || `Failed to ${type === "clone" ? "clone" : "create"} template`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;

          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          let event: any;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === "log") {
            setCloneLogs((prev) => [...prev, event.message]);
          } else if (event.type === "error") {
            setCloneLogs((prev) => [...prev, `Error: ${event.message}`]);
            setCloneStatus({ status: "error", message: event.message });
            toast.error(event.message);
          } else if (event.type === "done") {
            setCloneLogs((prev) => [...prev, event.message]);
            setCloneStatus({
              status: "success",
              message: event.message,
            });
            
            const successMsg = type === "clone" 
              ? "Repository cloned and processed successfully!" 
              : `${loaderDisplayName} template created!`;
            toast.success(successMsg);

            setFormData((prev) => ({
              ...prev,
              path: event.path || prev.path,
              gradleUrl: event.gradleUrl || prev.gradleUrl,
            }));

            if (event.modifiedFiles?.length > 0) {
              setCloneLogs((prev) => [...prev, `📝 Modified ${event.modifiedFiles.length} files`]);
            }
            if (event.addedFiles?.length > 0) {
              setCloneLogs((prev) => [...prev, `➕ Added ${event.addedFiles.length} files`]);
            }
            if (event.removedFiles?.length > 0) {
              setCloneLogs((prev) => [...prev, `❌ Removed ${event.removedFiles.length} files`]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "Failed to create template";
      setCloneStatus({ status: "error", message });
      setCloneLogs((prev) => [...prev, `❌ Error: ${message}`]);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [formData, loaderVersions, canGenerateTemplate, loaderDisplayName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        toast.error("Template name is required");
        return;
      }

      if (!formData.slug.trim()) {
        toast.error("Slug is required");
        return;
      }

      if (slugError) {
        toast.error(slugError);
        return;
      }

      if (!formData.platform) {
        toast.error("Platform is required");
        return;
      }

      if (!formData.loader) {
        toast.error("Loader is required");
        return;
      }

      if (!formData.minecraftVersion) {
        toast.error("Minecraft version is required");
        return;
      }

      if (!formData.path.trim()) {
        toast.error("Template path is required");
        return;
      }

      setLoading(true);

      try {
        const submitData = {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description?.trim() || null,
          thumbnailUrl: formData.thumbnailUrl?.trim() || null,
          platform: formData.platform,
          loader: formData.loader,
          minecraftVersion: formData.minecraftVersion.trim(),
          path: formData.path.trim(),
          templateRepoId: formData.templateRepoId || null,
          repoUrl: formData.repoUrl?.trim() || null,
          gradleUrl: formData.gradleUrl?.trim() || null,
          enabled: formData.enabled,
          isFeatured: formData.isFeatured,
          loaderMinecraftVersionId: formData.loaderMinecraftVersionId || null,
          tagIds: selectedTags,
        };

        const response = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const error = await response.json();
          if (response.status === 400 && error.error?.includes("slug")) {
            setSlugError(error.error);
            toast.error(error.error);
          } else {
            throw new Error(error.error || "Failed to create template");
          }
          return;
        }

        toast.success("Template created successfully");
        router.push("/admin/templates");
      } catch (error) {
        console.error("Error creating template:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to create template",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedTags, router, slugError],
  );

  const formatLogLine = (line: string) => {
    let cleaned = line
      .replace(/\r/g, "")
      .replace(/^Receiving objects:\s*/, "Receiving objects: ")
      .replace(/^Resolving deltas:\s*/, "Resolving deltas: ")
      .replace(/^Checking out files:\s*/, "Checking out files: ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (cleaned.match(/^\d+% \(\d+\/\d+\)/)) {
      return cleaned;
    }

    return cleaned;
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
          <h2 className="text-2xl font-semibold text-white">
            Add New Template
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Create a new template for developers to use
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-white/60">
                  Enter the basic details for this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Template Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Fabric Mod Template"
                    className="bg-white/5 border-white/10 text-white mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="text-white">
                    Slug *
                  </Label>
                  <div className="relative">
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="e.g., fabric-mod-template"
                      className={`bg-white/5 border-white/10 text-white mt-1.5 font-mono ${
                        slugError
                          ? "border-red-500/50 focus-visible:ring-red-500/40"
                          : ""
                      }`}
                      required
                    />
                    {isCheckingSlug && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Auto-generated from name
                  </p>
                  {slugError && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{slugError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what this template does..."
                    className="bg-white/5 border-white/10 text-white mt-1.5 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="text-white">Thumbnail Image</Label>
                  <div className="mt-1.5">
                    {formData.thumbnailUrl ? (
                      <div className="relative w-full max-w-[300px] rounded-lg overflow-hidden border border-white/10">
                        <div className="relative aspect-video">
                          <Image
                            src={formData.thumbnailUrl}
                            alt="Template thumbnail"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 rounded-full bg-white/5">
                            <ImageIcon className="h-8 w-8 text-white/40" />
                          </div>
                          <div className="text-sm text-white/60">
                            <span className="font-medium text-white/80">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </div>
                          <div className="text-xs text-white/40">
                            PNG, JPG, WebP up to 5MB
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-white/60">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Thumbnail will be stored in public/images/templates/
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Technical Details</CardTitle>
                <CardDescription className="text-white/60">
                  Configure the technical specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform" className="text-white">
                      Platform *
                    </Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) =>
                        handleSelectChange("platform", value)
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        <SelectItem value="JAVA">Java</SelectItem>
                        <SelectItem value="BEDROCK">Bedrock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="loader" className="text-white">
                      Loader *
                    </Label>
                    <Select
                      value={formData.loader}
                      onValueChange={(value) =>
                        handleSelectChange("loader", value)
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white">
                        {loaders.map((loader) => (
                          <SelectItem key={loader} value={loader}>
                            {LOADER_DISPLAY_NAMES[loader] || loader}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="minecraftVersion" className="text-white">
                    Minecraft Version *
                  </Label>
                  <Select
                    value={formData.minecraftVersion}
                    onValueChange={(value) =>
                      handleSelectChange("minecraftVersion", value)
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                      <SelectValue placeholder="Select Minecraft Version" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white max-h-[200px]">
                      {filteredVersions.map((version) => (
                        <SelectItem key={version.id} value={version.version}>
                          <div className="flex items-center gap-2">
                            <span>{version.version}</span>
                            {version.isLatest && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                                Latest
                              </Badge>
                            )}
                            {version.isSnapshot && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                                Snapshot
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredVersions.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      No versions available for this platform.
                    </p>
                  )}
                </div>

                {formData.loader && formData.minecraftVersion && (
                  <div>
                    <Label
                      htmlFor="loaderMinecraftVersionId"
                      className="text-white"
                    >
                      Loader Version
                    </Label>
                    <Select
                      value={formData.loaderMinecraftVersionId}
                      onValueChange={(value) =>
                        handleSelectChange("loaderMinecraftVersionId", value)
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                        <SelectValue placeholder="Select Loader Version" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white max-h-[200px]">
                        {loadingLoaders ? (
                          <div className="p-2 text-center text-white/40">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Loading loaders...
                          </div>
                        ) : filteredLoaderVersions.length > 0 ? (
                          filteredLoaderVersions.map((lv) => (
                            <SelectItem key={lv.id} value={lv.id}>
                              <div className="flex items-center gap-2">
                                <span>{lv.loaderVersion}</span>
                                {lv.recommended && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-yellow-400 text-sm">
                            No loader versions available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!loadingLoaders && filteredLoaderVersions.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        No loader versions available for {formData.loader} on{" "}
                        {formData.minecraftVersion}.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="path" className="text-white">
                    Template Path *
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="path"
                      name="path"
                      value={formData.path}
                      onChange={handleInputChange}
                      placeholder="Auto-generated from selections"
                      className="bg-white/5 border-white/10 text-white font-mono pl-10"
                      required
                    />
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Path where the template will be stored in public/templates/
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Repository */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Repository</CardTitle>
                <CardDescription className="text-white/60">
                  Configure template repository
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="repoUrl" className="text-white">
                    GitHub Repository URL
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Input
                      id="repoUrl"
                      name="repoUrl"
                      value={formData.repoUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/... (optional)"
                      className="bg-white/5 border-white/10 text-white flex-1 min-w-[150px]"
                    />
                    
                    {/* ✅ SATU BUTTON - Otomatis menyesuaikan */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateTemplate}
                      disabled={isProcessing || !formData.name || !formData.minecraftVersion}
                      className="border-white/10 text-white hover:bg-white/10 whitespace-nowrap"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {formData.repoUrl ? (
                            <GitBranch className="h-4 w-4 mr-2" />
                          ) : canGenerateTemplate ? (
                            <Sparkles className="h-4 w-4 mr-2" />
                          ) : (
                            <Hammer className="h-4 w-4 mr-2" />
                          )}
                          {formData.repoUrl ? (
                            "Clone & Process"
                          ) : canGenerateTemplate ? (
                            `Create ${loaderDisplayName}`
                          ) : (
                            `Clone Required`
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {formData.repoUrl ? (
                      "Clone from GitHub and auto-process for your version"
                    ) : canGenerateTemplate ? (
                      `Generate a fresh ${loaderDisplayName} template (no GitHub URL needed)`
                    ) : (
                      `${loaderDisplayName} template generation is not yet supported. Please provide a GitHub URL.`
                    )}
                  </p>

                  {/* Real-time log panel */}
                  {(cloneLogs.length > 0 || isProcessing) && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-white/40">
                        <Terminal className="h-3.5 w-3.5" />
                        <span className="font-medium">Log</span>
                        <span className="text-[10px] text-white/20">
                          {isProcessing ? "Processing..." : "Done"}
                        </span>
                        {isProcessing && (
                          <Loader2 className="h-3 w-3 animate-spin ml-auto text-white/40" />
                        )}
                        {cloneStatus.status === "success" && (
                          <span className="ml-auto text-green-400 text-[10px]">✓ Success</span>
                        )}
                        {cloneStatus.status === "error" && (
                          <span className="ml-auto text-red-400 text-[10px]">✗ Error</span>
                        )}
                      </div>
                      <div
                        ref={logContainerRef}
                        className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                      >
                        {cloneLogs.length === 0 && !isProcessing ? (
                          <div className="text-white/30 text-center py-4">
                            Click the button above to start...
                          </div>
                        ) : (
                          cloneLogs.map((line, idx) => {
                            const formatted = formatLogLine(line);
                            const isError =
                              line.startsWith("Error:") ||
                              line.startsWith("fatal:") ||
                              line.startsWith("❌");
                            const isSuccess = line.startsWith("✅");
                            const isModified = line.startsWith("📝");
                            const isAdded = line.startsWith("➕");
                            const isRemoved = line.startsWith("❌") && !line.startsWith("❌ Error");

                            let color = "text-white/70";
                            if (isError) color = "text-red-400";
                            else if (isSuccess) color = "text-green-400";
                            else if (isModified) color = "text-yellow-400/70";
                            else if (isAdded) color = "text-green-400/70";
                            else if (isRemoved) color = "text-red-400/70";

                            return (
                              <div key={idx} className={color}>
                                <span>
                                  <span className="text-white/20 select-none">
                                    │{" "}
                                  </span>
                                  {formatted}
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div ref={logEndRef} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <Info className="h-4 w-4" />
                      <span>Template Details</span>
                    </div>
                    <div className="space-y-1 text-xs text-white/60">
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="text-white font-medium">{formData.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loader:</span>
                        <span className="text-white font-medium">
                          {loaderDisplayName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minecraft Version:</span>
                        <span className="text-white font-medium">
                          {formData.minecraftVersion || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Template Path:</span>
                        <span className="text-white font-mono text-[10px] truncate max-w-[180px]">
                          {formData.path || "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gradleUrl" className="text-white">
                    Gradle URL
                  </Label>
                  <Input
                    id="gradleUrl"
                    name="gradleUrl"
                    value={formData.gradleUrl}
                    onChange={handleInputChange}
                    placeholder="Auto-populated after template creation"
                    className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                    readOnly
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Gradle URL will be auto-populated after template creation
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Configure template visibility and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white cursor-pointer">Enabled</Label>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("enabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white cursor-pointer">Featured</Label>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isFeatured", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Tags</CardTitle>
                <CardDescription className="text-white/60">
                  Select tags for this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge
                        key={tag.id}
                        className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag.id)}
                          className="ml-1 hover:text-blue-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {tags
                    .filter((tag) => !selectedTags.includes(tag.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-white/10 text-white/60 border-white/20"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={loading || !!slugError}
              className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
            {slugError && (
              <p className="text-xs text-red-400 text-center">
                Please fix the slug error before submitting
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}