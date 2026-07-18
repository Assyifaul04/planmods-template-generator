// app/admin/projects/configs/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Settings, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ProjectConfig {
  id: string;
  projectId: string;
  loaderVersion: string | null;
  fabricApiVersion: string | null;
  loomVersion: string | null;
  javaVersion: string | null;
  gradleVersion: string | null;
  yarnVersion: string | null;
  mappingVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectConfigsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchConfig();
    }
  }, [projectId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}/config`);
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Error fetching project config:", error);
      toast.error("Failed to fetch project config");
    } finally {
      setLoading(false);
    }
  };

  const configFields = [
    { key: "loaderVersion", label: "Loader Version" },
    { key: "fabricApiVersion", label: "Fabric API Version" },
    { key: "loomVersion", label: "Loom Version" },
    { key: "javaVersion", label: "Java Version" },
    { key: "gradleVersion", label: "Gradle Version" },
    { key: "yarnVersion", label: "Yarn Version" },
    { key: "mappingVersion", label: "Mapping Version" },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/projects")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">Project Configuration</h2>
          <p className="text-sm text-white/60 mt-1">
            Configuration details for project {projectId?.slice(0, 8) || ""}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Setting</TableHead>
              <TableHead className="text-white/60 font-medium">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading configuration...
                  </div>
                </TableCell>
              </TableRow>
            ) : config ? (
              <>
                {configFields.map((field) => (
                  <TableRow key={field.key} className="border-white/10">
                    <TableCell className="text-white/60">{field.label}</TableCell>
                    <TableCell className="text-white">
                      {config[field.key as keyof ProjectConfig] || (
                        <span className="text-white/30">Not set</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-white/10">
                  <TableCell className="text-white/60">Created</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(config.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="text-white/60">Last Updated</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(config.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Settings className="h-12 w-12 text-white/20" />
                    <p>No configuration found for this project</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}