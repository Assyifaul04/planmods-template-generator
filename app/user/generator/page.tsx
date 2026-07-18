// app/user/generator/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HammerIcon,
  PackageIcon,
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  SparklesIcon,
  Code2Icon,
  GithubIcon,
  FileArchiveIcon,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  platform: string;
  loader: string;
  minecraftVersion: string;
  isFeatured: boolean;
  usageCount: number;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface FormData {
  templateId: string;
  name: string;
  description: string;
  platform: string;
  loader: string;
  minecraftVersion: string;
  packageName: string;
  modId: string;
  author: string;
  version: string;
  license: string;
  visibility: string;
}

const LOADERS = {
  JAVA: ["FABRIC", "FORGE", "NEOFORGE", "PAPER", "SPIGOT", "PURPUR", "FOLIA", "VELOCITY", "WATERFALL", "BUNGEECORD"],
  BEDROCK: ["BEDROCK_ADDON", "BEDROCK_SCRIPT"],
};

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Private" },
  { value: "UNLISTED", label: "Unlisted" },
  { value: "PUBLIC", label: "Public" },
];

export default function GenerateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [formData, setFormData] = useState<FormData>({
    templateId: "",
    name: "",
    description: "",
    platform: "JAVA",
    loader: "FABRIC",
    minecraftVersion: "1.20.4",
    packageName: "",
    modId: "",
    author: "",
    version: "1.0.0",
    license: "MIT",
    visibility: "PRIVATE",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        ...formData,
        templateId: template.id,
        platform: template.platform,
        loader: template.loader,
        minecraftVersion: template.minecraftVersion,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch("/api/user/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate project");
      }

      // Redirect to project page after generation
      setTimeout(() => {
        router.push(`/user/projects/${data.project.id}`);
      }, 2000);
    } catch (error) {
      console.error("Error generating project:", error);
      setGenerating(false);
    }
  };

  const getLoaderOptions = () => {
    return LOADERS[formData.platform as keyof typeof LOADERS] || [];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Generate Project</h1>
            <p className="text-sm text-white/40">Create a new project from a template</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-full bg-white/5" />
            <Skeleton className="h-32 w-full bg-white/5" />
            <Skeleton className="h-12 w-full bg-white/5" />
          </div>
          <div>
            <Skeleton className="h-64 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Generate Project</h1>
          <p className="text-sm text-white/40">Create a new project from a template</p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 text-white hover:bg-white/10"
          onClick={() => router.push("/user/projects")}
        >
          My Projects
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Template Selection */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <Label className="text-sm text-white">Select Template *</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      formData.templateId === template.id
                        ? "border-white bg-white/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="relative h-12 w-full overflow-hidden rounded bg-white/5">
                      {template.thumbnailUrl ? (
                        <Image
                          src={template.thumbnailUrl}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <PackageIcon className="h-6 w-6 text-white/20" />
                        </div>
                      )}
                      {template.isFeatured && (
                        <Badge className="absolute right-1 top-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-white truncate">
                      {template.name}
                    </p>
                    <div className="flex gap-1 mt-0.5">
                      <Badge variant="outline" className="text-[9px] text-white/30 border-white/10">
                        {template.platform}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-white/30 border-white/10">
                        {template.loader}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {templates.length === 0 && (
                <p className="text-sm text-white/40 text-center py-4">No templates available</p>
              )}
            </Card>

            {/* Project Details */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-white">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Awesome Mod"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your project..."
                    className="mt-1.5 bg-white/5 border-white/10 text-white min-h-[80px]"
                  />
                </div>
              </div>
            </Card>

            {/* Technical Details */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-sm font-medium text-white mb-4">Technical Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform" className="text-sm text-white">
                    Platform *
                  </Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => handleSelectChange("platform", value)}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="JAVA">Java</SelectItem>
                      <SelectItem value="BEDROCK">Bedrock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="loader" className="text-sm text-white">
                    Loader *
                  </Label>
                  <Select
                    value={formData.loader}
                    onValueChange={(value) => handleSelectChange("loader", value)}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      {getLoaderOptions().map((loader) => (
                        <SelectItem key={loader} value={loader}>
                          {loader}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minecraftVersion" className="text-sm text-white">
                    Minecraft Version *
                  </Label>
                  <Input
                    id="minecraftVersion"
                    name="minecraftVersion"
                    value={formData.minecraftVersion}
                    onChange={handleInputChange}
                    placeholder="1.20.4"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="packageName" className="text-sm text-white">
                    Package Name *
                  </Label>
                  <Input
                    id="packageName"
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleInputChange}
                    placeholder="com.example.mod"
                    className="mt-1.5 bg-white/5 border-white/10 text-white font-mono"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Mod Details */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-sm font-medium text-white mb-4">Mod Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modId" className="text-sm text-white">
                    Mod ID *
                  </Label>
                  <Input
                    id="modId"
                    name="modId"
                    value={formData.modId}
                    onChange={handleInputChange}
                    placeholder="my_mod"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="author" className="text-sm text-white">
                    Author
                  </Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder={session?.user?.name || "Your Name"}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="version" className="text-sm text-white">
                    Version
                  </Label>
                  <Input
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="license" className="text-sm text-white">
                    License
                  </Label>
                  <Select
                    value={formData.license}
                    onValueChange={(value) => handleSelectChange("license", value)}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="MIT">MIT</SelectItem>
                      <SelectItem value="GPL-3.0">GPL-3.0</SelectItem>
                      <SelectItem value="Apache-2.0">Apache-2.0</SelectItem>
                      <SelectItem value="BSD-3-Clause">BSD-3-Clause</SelectItem>
                      <SelectItem value="LGPL-3.0">LGPL-3.0</SelectItem>
                      <SelectItem value="MPL-2.0">MPL-2.0</SelectItem>
                      <SelectItem value="UNLICENSED">Unlicensed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Template Preview */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-sm font-medium text-white mb-3">Selected Template</h3>
              {selectedTemplate ? (
                <div>
                  <div className="relative h-24 w-full overflow-hidden rounded bg-white/5">
                    {selectedTemplate.thumbnailUrl ? (
                      <Image
                        src={selectedTemplate.thumbnailUrl}
                        alt={selectedTemplate.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PackageIcon className="h-8 w-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 font-medium text-white">{selectedTemplate.name}</p>
                  <p className="text-xs text-white/40 line-clamp-2">
                    {selectedTemplate.description || "No description available"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTemplate.tags.map((t) => (
                      <Badge key={t.tag.id} variant="outline" className="text-[10px] text-white/30 border-white/10">
                        {t.tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                    <span>Used {selectedTemplate.usageCount} times</span>
                    {selectedTemplate.isFeatured && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/40 text-center py-4">
                  Select a template to preview
                </p>
              )}
            </Card>

            {/* Visibility */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <Label className="text-sm text-white">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => handleSelectChange("visibility", value)}
              >
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/30 mt-2">
                Private: Only you can see it • Unlisted: Anyone with link • Public: Everyone can see
              </p>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              disabled={generating || !formData.templateId || !formData.name}
              className="w-full bg-white text-black hover:bg-white/90"
            >
              {generating ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <HammerIcon className="h-4 w-4 mr-2" />
                  Generate Project
                </>
              )}
            </Button>

            {/* Features */}
            <Card className="border-white/10 bg-white/[0.02] p-4">
              <h4 className="text-xs font-medium text-white/40 mb-3">What you get</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                  Ready-to-use project structure
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                  Pre-configured build system
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                  GitHub integration ready
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                  ZIP download available
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                  VS Code optimized
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}