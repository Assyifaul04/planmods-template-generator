// app/user/projects/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import {
  ArrowLeftIcon,
  Loader2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

const platforms = ["JAVA", "BEDROCK"];
const loaders = {
  JAVA: ["FABRIC", "FORGE", "NEOFORGE", "PAPER", "SPIGOT", "PURPUR", "FOLIA", "VELOCITY", "WATERFALL", "BUNGEECORD"],
  BEDROCK: ["BEDROCK_ADDON", "BEDROCK_SCRIPT"],
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    platform: "JAVA",
    loader: "FABRIC",
    minecraftVersion: "1.20.4",
    packageName: "",
    modId: "",
    visibility: "PRIVATE",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === "name") {
      const slug = slugify(value, { lower: true, strict: true });
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          packageName: formData.packageName || `com.example.${formData.slug}`,
          modId: formData.modId || formData.slug,
          author: session?.user?.name || "Unknown",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast.success("Project created successfully!");
      router.push(`/user/projects/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/user/projects")}
          className="text-white/40 hover:text-white hover:bg-white/5"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-white">Create Project</h1>
          <p className="text-sm text-white/40">Start a new Minecraft project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-white/10 bg-white/[0.02] p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-white/60 text-sm">
                  Project Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome Mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-white/60 text-sm">
                  Slug *
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="my-awesome-mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                  required
                />
                <p className="text-xs text-white/30 mt-1">Auto-generated from name</p>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-white/60 text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your project..."
                className="bg-white/5 border-white/10 text-white mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Technical Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="platform" className="text-white/60 text-sm">
                  Platform *
                </Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => handleSelectChange("platform", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {platforms.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="loader" className="text-white/60 text-sm">
                  Loader *
                </Label>
                <Select
                  value={formData.loader}
                  onValueChange={(value) => handleSelectChange("loader", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    {loaders[formData.platform as keyof typeof loaders]?.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="minecraftVersion" className="text-white/60 text-sm">
                Minecraft Version *
              </Label>
              <Input
                id="minecraftVersion"
                name="minecraftVersion"
                value={formData.minecraftVersion}
                onChange={handleInputChange}
                placeholder="1.20.4"
                className="bg-white/5 border-white/10 text-white mt-1.5"
                required
              />
            </div>
          </div>

          {/* Package Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Package Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="packageName" className="text-white/60 text-sm">
                  Package Name
                </Label>
                <Input
                  id="packageName"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleInputChange}
                  placeholder="com.example.mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="modId" className="text-white/60 text-sm">
                  Mod ID
                </Label>
                <Input
                  id="modId"
                  name="modId"
                  value={formData.modId}
                  onChange={handleInputChange}
                  placeholder="my_mod"
                  className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Visibility</h3>
            <Select
              value={formData.visibility}
              onValueChange={(value) => handleSelectChange("visibility", value)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10 text-white">
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/30">
              Private: Only you can see it · Unlisted: Anyone with the link · Public: Everyone can see
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/user/projects")}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-white/90"
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}