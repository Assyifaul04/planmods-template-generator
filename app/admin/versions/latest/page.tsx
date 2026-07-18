// app/admin/versions/latest/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Package, Box, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface LatestVersion {
  id: string;
  version: string;
  platform: "JAVA" | "BEDROCK";
  isLatest: boolean;
  releaseDate: string | null;
  loaderVersions: Array<{
    id: string;
    loader: string;
    loaderVersion: string;
    recommended: boolean;
  }>;
  _count: {
    projects: number;
    templates: number;
  };
}

export default function LatestVersionsPage() {
  const router = useRouter();
  const [versions, setVersions] = useState<LatestVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestVersions();
  }, []);

  const fetchLatestVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/versions?isLatest=true&limit=20");
      const data = await response.json();
      setVersions(data.versions);
    } catch (error) {
      console.error("Error fetching latest versions:", error);
      toast.error("Failed to fetch latest versions");
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
          onClick={() => router.push("/admin/versions")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Latest Versions</h2>
          <p className="text-sm text-white/60 mt-1">
            View all latest Minecraft versions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLatestVersions}
          className="ml-auto border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-black/40 border-white/10 animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-white/10 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-4 w-20 bg-white/10 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : versions.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-white/40">
            <Star className="h-12 w-12 mx-auto text-white/20" />
            <p className="mt-3">No latest versions found</p>
          </div>
        ) : (
          versions.map((version) => (
            <Card key={version.id} className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  {version.version}
                </CardTitle>
                <CardDescription className="text-white/60">
                  {version.platform} · {version.releaseDate ? new Date(version.releaseDate).toLocaleDateString() : "No release date"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-white/40">Loaders</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {version.loaderVersions.map((lv) => (
                        <Badge key={lv.id} variant="outline" className="text-white/40 border-white/10">
                          {lv.loader}
                          {lv.recommended && (
                            <Star className="h-2.5 w-2.5 ml-1 fill-yellow-400 text-yellow-400" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Projects</span>
                    <span className="text-white/60">{version._count.projects}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Templates</span>
                    <span className="text-white/60">{version._count.templates}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                    onClick={() => router.push(`/admin/versions/${version.id}`)}
                  >
                    <Box className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}