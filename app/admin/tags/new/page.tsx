// app/admin/tags/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

export default function NewTagPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "name") {
      const slug = slugify(value, { lower: true, strict: true });
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tag");
      }

      toast.success("Tag created successfully");
      router.push("/admin/tags");
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/tags")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Add New Tag</h2>
          <p className="text-sm text-white/60 mt-1">
            Create a new tag for categorizing templates
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-black/40 border-white/10 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-white">Tag Information</CardTitle>
            <CardDescription className="text-white/60">
              Enter the details for the new tag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Tag Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Fabric Mod"
                className="bg-white/5 border-white/10 text-white mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-white">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="e.g., fabric-mod"
                className="bg-white/5 border-white/10 text-white mt-1.5 font-mono"
                required
              />
              <p className="text-xs text-white/40 mt-1">Auto-generated from name</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-white/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Tag
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}