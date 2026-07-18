// app/user/projects/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "JAVA",
    loader: "FABRIC",
    minecraftVersion: "1.20.4",
    version: "1.0.0",
    license: "MIT",
    status: "DRAFT",
    visibility: "PRIVATE",
  });

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/user/projects/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setFormData({
        name: data.name,
        description: data.description || "",
        platform: data.platform,
        loader: data.loader,
        minecraftVersion: data.minecraftVersion,
        version: data.version,
        license: data.license,
        status: data.status,
        visibility: data.visibility,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
      router.push("/user/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/user/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update project");
      }

      toast.success("Project updated successfully!");
      router.push(`/user/projects/${params.id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/user/projects/${params.id}`)}
          className="text-white/40 hover:text-white hover:bg-white/5"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-white">Edit Project</h1>
          <p className="text-sm text-white/40">Update your project details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-white/10 bg-white/[0.02] p-6 space-y-6">
          {/* Form fields similar to create page */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white/60 text-sm">
                Project Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white/60 text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/user/projects/${params.id}`)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-white text-black hover:bg-white/90"
            >
              {saving ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}