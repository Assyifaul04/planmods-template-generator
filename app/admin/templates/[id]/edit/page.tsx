// app/admin/templates/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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
  AlertCircle,
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

interface TemplateData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  path: string;
  templateRepoId: string | null;
  repoUrl: string | null;
  gradleUrl: string | null;
  enabled: boolean;
  isFeatured: boolean;
  loaderMinecraftVersionId: string | null;
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  templateRepo: TemplateRepo | null;
  mcVersionData: MinecraftVersion | null;
  LoaderMinecraftVersion: LoaderMinecraftVersion | null;
  _count: {
    projects: number;
  };
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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [repos, setRepos] = useState<TemplateRepo[]>([]);
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [loaderVersions, setLoaderVersions] = useState<
    LoaderMinecraftVersion[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [originalSlug, setOriginalSlug] = useState("");

  const [cloneStatus, setCloneStatus] = useState<{
    status: "idle" | "cloning" | "success" | "error";
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

  // Fetch template data
  const fetchTemplate = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const response = await fetch(`/api/admin/templates/${templateId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Template not found");
          toast.error("Template not found");
        } else {
          throw new Error("Failed to fetch template");
        }
        return;
      }

      const data: TemplateData = await response.json();
      
      // Set form data
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        thumbnailUrl: data.thumbnailUrl || "",
        platform: data.platform,
        loader: data.loader,
        minecraftVersion: data.minecraftVersion,
        path: data.path,
        templateRepoId: data.templateRepoId || "",
        repoUrl: data.repoUrl || "",
        gradleUrl: data.gradleUrl || "",
        enabled: data.enabled,
        isFeatured: data.isFeatured,
        loaderMinecraftVersionId: data.loaderMinecraftVersionId || "",
      });

      setOriginalSlug(data.slug);
      
      // Set selected tags
      setSelectedTags(data.tags.map((t) => t.tag.id));

      // Fetch loader versions if loader and version are set
      if (data.loader && data.minecraftVersion) {
        await fetchLoaderVersionsForTemplate(data.loader, data.minecraftVersion);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      setError("Failed to load template data");
      toast.error("Failed to load template data");
    } finally {
      setLoadingData(false);
    }
  }, [templateId]);

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

  const fetchLoaderVersionsForTemplate = useCallback(
    async (loader: string, minecraftVersion: string) => {
      if (!loader || !minecraftVersion) return;

      setLoadingLoaders(true);
      try {
        const version = versions.find(
          (v) => v.version === minecraftVersion,
        );
        if (!version) {
          setLoaderVersions([]);
          return;
        }

        const params = new URLSearchParams({
          loader: loader,
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

        const data = await response.json();
        setLoaderVersions(data || []);
      } catch (error) {
        console.error("Error fetching loader versions:", error);
        setLoaderVersions([]);
      } finally {
        setLoadingLoaders(false);
      }
    },
    [versions],
  );

  const fetchLoaderVersions = useCallback(async () => {
    if (!formData.loader || !formData.minecraftVersion) {
      setLoaderVersions([]);
      return;
    }

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

      const data = await response.json();
      setLoaderVersions(data || []);
    } catch (error) {
      console.error("Error fetching loader versions:", error);
      setLoaderVersions([]);
    } finally {
      setLoadingLoaders(false);
    }
  }, [formData.loader, formData.minecraftVersion, versions]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTags(), fetchRepos(), fetchVersions()]);
      await fetchTemplate();
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

  // Check if slug is unique (only if changed)
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug || formData.slug.length < 3) {
        setSlugError(null);
        return;
      }

      // Skip check if slug hasn't changed
      if (formData.slug === originalSlug) {
        setSlugError(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/admin/templates/check-slug?slug=${encodeURIComponent(formData.slug)}&excludeId=${templateId}`,
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
  }, [formData.slug, originalSlug, templateId]);

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

  const handleCloneRepository = useCallback(async () => {
    if (!formData.repoUrl) {
      toast.error("Please enter a repository URL");
      return;
    }

    if (!formData.name) {
      toast.error("Please enter a template name");
      return;
    }

    setIsCloning(true);
    setCloneLogs([]);
    setCloneStatus({ status: "cloning", message: "Cloning repository..." });

    try {
      const response = await fetch("/api/admin/templates/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: formData.repoUrl,
          templateName: formData.name,
          platform: formData.platform,
          loader: formData.loader,
          minecraftVersion: formData.minecraftVersion,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({})) as any;
        throw new Error(data.error || "Failed to clone repository");
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
            toast.success("Repository cloned successfully!");

            setFormData((prev) => ({
              ...prev,
              path: event.path || prev.path,
              gradleUrl: event.gradleUrl || prev.gradleUrl,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error cloning repository:", error);
      const message =
        error instanceof Error ? error.message : "Failed to clone repository";
      setCloneStatus({ status: "error", message });
      setCloneLogs((prev) => [...prev, `Error: ${message}`]);
      toast.error(message);
    } finally {
      setIsCloning(false);
    }
  }, [formData]);

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

        const response = await fetch(`/api/admin/templates/${templateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const error = await response.json();
          if (response.status === 400 && error.error?.includes("slug")) {
            setSlugError(error.error);
            toast.error(error.error);
          } else {
            throw new Error(error.error || "Failed to update template");
          }
          return;
        }

        toast.success("Template updated successfully");
        router.push("/admin/templates");
      } catch (error) {
        console.error("Error updating template:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update template",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedTags, router, slugError, templateId],
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white/40 mx-auto mb-4" />
          <p className="text-white/60">Loading template data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Error Loading Template</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/admin/templates")}
            className="bg-white text-black hover:bg-white/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

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
            Edit Template
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Update template details for {formData.name}
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
                  Update the basic details for this template
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
                  {formData.thumbnailUrl && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Image uploaded: {formData.thumbnailUrl}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Technical Details</CardTitle>
                <CardDescription className="text-white/60">
                  Update the technical specifications
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
                            {loader}
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
                  Update template repository
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="repoUrl" className="text-white">
                    GitHub Repository URL *
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="repoUrl"
                      name="repoUrl"
                      value={formData.repoUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/FabricMC/fabric-example-mod"
                      className="bg-white/5 border-white/10 text-white flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloneRepository}
                      disabled={
                        isCloning || !formData.repoUrl || !formData.name
                      }
                      className="border-white/10 text-white hover:bg-white/10 whitespace-nowrap"
                    >
                      {isCloning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GitBranch className="h-4 w-4" />
                      )}
                      Re-clone
                    </Button>
                  </div>

                  {/* Real-time clone log panel */}
                  {(cloneLogs.length > 0 || isCloning) && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-white/40">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Clone Log</span>
                        {isCloning && (
                          <Loader2 className="h-3 w-3 animate-spin ml-auto text-white/40" />
                        )}
                      </div>
                      <div
                        ref={logContainerRef}
                        className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px] leading-relaxed"
                      >
                        {cloneLogs.map((line, idx) => {
                          const formatted = formatLogLine(line);
                          const isError =
                            line.startsWith("Error:") ||
                            line.startsWith("fatal:");
                          const isProgress = line.match(/^\d+%|\d+\/\d+/);

                          return (
                            <div
                              key={idx}
                              className={
                                isError
                                  ? "text-red-400"
                                  : isProgress
                                    ? "text-blue-400/80"
                                    : line.startsWith("$")
                                      ? "text-white/30"
                                      : line.startsWith("Created") ||
                                          line.startsWith("Removed")
                                        ? "text-green-400/70"
                                        : "text-white/70"
                              }
                            >
                              {line.startsWith("$") ? (
                                <span>{formatted}</span>
                              ) : (
                                <span>
                                  <span className="text-white/20 select-none">
                                    │{" "}
                                  </span>
                                  {formatted}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <div ref={logEndRef} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <Info className="h-4 w-4" />
                      <span>Repository Details</span>
                    </div>
                    <div className="space-y-1 text-xs text-white/60">
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="text-white">{formData.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loader:</span>
                        <span className="text-white">
                          {formData.loader || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minecraft Version:</span>
                        <span className="text-white">
                          {formData.minecraftVersion || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Template Path:</span>
                        <span className="text-white font-mono truncate max-w-[200px]">
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
                    placeholder="Auto-populated after clone"
                    className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                    readOnly
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Gradle URL will be auto-populated after cloning
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Update template visibility and features
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
                  Update tags for this template
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

                <div className="text-xs text-white/40 mt-3">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Statistics</CardTitle>
                <CardDescription className="text-white/60">
                  Template usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Total Projects</span>
                    <span className="text-white font-medium">
                      {/* We need to fetch this from the template data */}
                      Loading...
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Created</span>
                    <span className="text-white font-mono text-xs">
                      {/* We need to fetch this from the template data */}
                      Loading...
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Last Updated</span>
                    <span className="text-white font-mono text-xs">
                      {/* We need to fetch this from the template data */}
                      Loading...
                    </span>
                  </div>
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Template
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