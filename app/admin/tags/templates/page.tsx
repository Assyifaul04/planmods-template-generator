// app/admin/tags/templates/page.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Hash, Package, Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface TemplateWithTag {
  template: {
    id: string;
    name: string;
    slug: string;
    platform: string;
    loader: string;
    enabled: boolean;
    mcVersionData: {
      version: string;
      platform: string;
    } | null;
    templateRepo: {
      repoUrl: string;
    } | null;
    _count: {
      projects: number;
    };
  };
}

interface TagWithTemplates {
  id: string;
  name: string;
  slug: string;
  templates: TemplateWithTag[];
}

export default function TemplateTagsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag");
  const [tag, setTag] = useState<TagWithTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (tagId) {
      fetchTemplatesByTag();
    }
  }, [tagId]);

  const fetchTemplatesByTag = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tags/${tagId}/templates`);
      const data = await response.json();
      setTag(data);
    } catch (error) {
      console.error("Error fetching templates by tag:", error);
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
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
      QUILT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PAPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      SPIGOT: "bg-green-500/20 text-green-400 border-green-500/30",
      ADDON: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return colors[loader] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const filteredTemplates = tag?.templates.filter((item) =>
    item.template.name.toLowerCase().includes(search.toLowerCase()) ||
    item.template.slug.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="text-2xl font-semibold text-white">
            Templates with "{tag?.name || "Tag"}"
          </h2>
          <p className="text-sm text-white/60 mt-1">
            All templates that have this tag
          </p>
        </div>
        <Badge className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Hash className="h-3 w-3 mr-1" />
          {tag?.templates.length || 0} templates
        </Badge>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Templates</CardTitle>
              <CardDescription className="text-white/60">
                Templates associated with this tag
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchTemplatesByTag}
                className="border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60 font-medium">Template</TableHead>
                <TableHead className="text-white/60 font-medium">Platform</TableHead>
                <TableHead className="text-white/60 font-medium">Loader</TableHead>
                <TableHead className="text-white/60 font-medium">MC Version</TableHead>
                <TableHead className="text-white/60 font-medium">Status</TableHead>
                <TableHead className="text-white/60 font-medium">Projects</TableHead>
                <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                      Loading templates...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !tag ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    <div className="flex flex-col items-center gap-2">
                      <Hash className="h-12 w-12 text-white/20" />
                      <p>Tag not found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTemplates && filteredTemplates.length > 0 ? (
                filteredTemplates.map((item) => (
                  <TableRow key={item.template.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{item.template.name}</div>
                        <div className="text-xs text-white/40">{item.template.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlatformBadge(item.template.platform)}</TableCell>
                    <TableCell>
                      <Badge className={getLoaderColor(item.template.loader)}>
                        {item.template.loader}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60">
                      {item.template.mcVersionData?.version || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.template.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                        {item.template.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60">{item.template._count.projects}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/templates/${item.template.id}`)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/40">
                    No templates found with this tag
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}