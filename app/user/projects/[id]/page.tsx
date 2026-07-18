// app/user/projects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  PencilIcon,
  Trash2Icon,
  GitBranchIcon,
  DownloadIcon,
  StarIcon,
  EyeIcon,
  CopyIcon,
  CheckCircle2Icon,
  XCircleIcon,
  FileEditIcon,
  RefreshCwIcon,
  ArchiveIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  loader: string;
  minecraftVersion: string;
  status: string;
  visibility: string;
  starsCount: number;
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  githubRepository: {
    id: string;
    repositoryName: string;
    repositoryUrl: string;
    private: boolean;
  } | null;
  builds: any[];
  downloads: any[];
  collaborators: any[];
  stars: any[];
  _count: {
    builds: number;
    downloads: number;
    stars: number;
    collaborators: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  READY: { label: "Ready", icon: CheckCircle2Icon, className: "text-emerald-400" },
  FAILED: { label: "Failed", icon: XCircleIcon, className: "text-red-400" },
  DRAFT: { label: "Draft", icon: FileEditIcon, className: "text-yellow-400" },
  GENERATING: { label: "Generating", icon: RefreshCwIcon, className: "text-blue-400" },
  ARCHIVED: { label: "Archived", icon: ArchiveIcon, className: "text-white/40" },
};

const visibilityConfig: Record<
  string,
  { label: string; className: string }
> = {
  PUBLIC: { label: "Public", className: "text-green-400 border-green-400/30" },
  UNLISTED: { label: "Unlisted", className: "text-yellow-400 border-yellow-400/30" },
  PRIVATE: { label: "Private", className: "text-white/40 border-white/10" },
};

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/projects/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Project not found");
          router.push("/user/projects");
          return;
        }
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (project) {
      navigator.clipboard.writeText(project.id);
      toast.success("Project ID copied!");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 bg-white/10" />
          <Skeleton className="h-8 w-48 bg-white/10" />
        </div>
        <Card className="border-white/10 bg-white/[0.02] p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-20 w-full bg-white/10" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-white/60">Project not found</p>
        <Button
          variant="outline"
          className="mt-4 border-white/10 text-white hover:bg-white/10"
          onClick={() => router.push("/user/projects")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status] || { label: project.status, icon: FileEditIcon, className: "" };
  const StatusIcon = status.icon;
  const visibility = visibilityConfig[project.visibility] || { label: project.visibility, className: "" };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-xl font-semibold text-white">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/30">{project.slug}</span>
              <button
                onClick={copyId}
                className="text-white/20 hover:text-white/40 transition-colors"
              >
                <CopyIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
            onClick={() => router.push(`/user/projects/${project.id}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {project.githubRepository ? (
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/10"
              asChild
            >
              <a href={project.githubRepository.repositoryUrl} target="_blank" rel="noreferrer">
                <GitBranchIcon className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => router.push(`/user/projects/${project.id}/github`)}
            >
              <GitBranchIcon className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {/* Project Info */}
      <Card className="border-white/10 bg-white/[0.02] p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-white/60">Description</h3>
            <p className="text-white/80 mt-1">
              {project.description || "No description provided"}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Status</span>
              <Badge variant="outline" className={`border-none ${status.className}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Visibility</span>
              <Badge variant="outline" className={visibility.className}>
                {visibility.label}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Platform</span>
              <span className="text-white/80">{project.platform}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Loader</span>
              <span className="text-white/80">{project.loader}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Minecraft Version</span>
              <span className="text-white/80">{project.minecraftVersion}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-6 pt-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{project.downloadsCount}</p>
              <p className="text-xs text-white/40">Downloads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{project.starsCount}</p>
              <p className="text-xs text-white/40">Stars</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{project._count.builds}</p>
              <p className="text-xs text-white/40">Builds</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{project._count.collaborators}</p>
              <p className="text-xs text-white/40">Collaborators</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Template Info */}
      {project.template && (
        <Card className="border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-white/60 mb-2">Template</h3>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-white/60 border-white/10">
              {project.template.name}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}