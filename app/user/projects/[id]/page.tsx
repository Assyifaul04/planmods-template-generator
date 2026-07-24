"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FolderTree,
  File,
  FileJson,
  FileText,
  Package,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Download,
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  Star,
  GitBranch,
  Calendar,
  User,
  Code2,
  Layers,
  Settings,
  Edit,
  Files,
  FileIcon,
  Image,
  Terminal,
  Coffee,
  FileSpreadsheet,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ManageCollaborators } from "@/components/projects/ManageCollaborators";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
}

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  packageName: string;
  modId: string;
  author: string;
  version: string;
  license: string;
  status: "DRAFT" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED";
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
  starsCount: number;
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    slug: string;
  } | null;
  mcVersionData: {
    version: string;
    platform: string;
  } | null;
  githubRepository: {
    id: string;
    repositoryName: string;
    repositoryUrl: string;
    cloneUrl: string;
    defaultBranch: string;
    private: boolean;
    lastSyncedAt: string | null;
  } | null;
  _count: {
    downloads: number;
    stars: number;
    builds: number;
    collaborators: number;
  };
}

// ✅ Fungsi untuk deteksi OS
function getOS() {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  
  if (userAgent.includes('win') || platform.includes('win')) {
    return 'windows';
  }
  if (userAgent.includes('mac') || platform.includes('mac')) {
    return 'mac';
  }
  if (userAgent.includes('linux') || platform.includes('linux')) {
    return 'linux';
  }
  return 'unknown';
}

// ✅ Fungsi untuk mendapatkan build command sesuai OS
function getBuildCommands(projectName: string, os: string) {
  const commands = {
    windows: [
      `cd %USERPROFILE%\\Downloads\\${projectName}`,
      `gradlew.bat build`,
      `# Atau jika gradlew tidak ada:`,
      `gradle build`,
    ],
    mac: [
      `cd ~/Downloads/${projectName}`,
      `chmod +x gradlew`,
      `./gradlew build`,
    ],
    linux: [
      `cd ~/Downloads/${projectName}`,
      `chmod +x gradlew`,
      `./gradlew build`,
    ],
  };
  
  return commands[os as keyof typeof commands] || commands.windows;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [userRole, setUserRole] = useState<"OWNER" | "EDITOR" | "VIEWER" | null>(
    null,
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [buildCommands, setBuildCommands] = useState<string[]>([]);
  const [osType, setOsType] = useState<string>("windows");
  const [copiedCommand, setCopiedCommand] = useState<number | null>(null);

  // --- STATE & REFS UNTUK RESIZABLE SIDEBAR (IDE-style Explorer) ---
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ✅ Deteksi OS saat component mount
  useEffect(() => {
    const os = getOS();
    setOsType(os);
  }, []);

  // Efek untuk menangani event mouse drag pada resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !sidebarRef.current) return;

      const containerLeft =
        sidebarRef.current.parentElement?.getBoundingClientRect().left || 0;
      const newWidth = e.clientX - containerLeft;

      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  // -------------------------------------------------------------------

  useEffect(() => {
    fetchProject();
    fetchProjectFiles();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/projects/${id}`);
      const data = await response.json();
      setProject(data);

      if (data.userId === session?.user?.id) {
        setUserRole("OWNER");
      } else if (session?.user?.role === "ADMIN") {
        setUserRole("OWNER");
      } else {
        const collaborator = data.collaborators?.find(
          (c: any) => c.userId === session?.user?.id
        );
        if (collaborator) {
          setUserRole(collaborator.role);
        } else {
          setUserRole("VIEWER");
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to fetch project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch(`/api/user/projects/${id}/files`);
      const data = await response.json();
      setFileStructure(data.fileStructure || []);

      const rootFolders = new Set<string>();
      data.fileStructure?.forEach((node: FileNode) => {
        if (node.type === "folder") {
          rootFolders.add(node.path);
        }
      });
      setExpandedFolders(rootFolders);

      if (data.fileStructure && data.fileStructure.length > 0) {
        const firstFile = findFirstFile(data.fileStructure);
        if (firstFile) {
          setSelectedFile(firstFile);
          setFileContent(firstFile.content || "");
        }
      }
    } catch (error) {
      console.error("Error fetching project files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === "file") {
        return node;
      }
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file);
    setFileContent(file.content || "");
  };

  const handleCopyContent = async () => {
    if (!fileContent) return;
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  // ✅ Copy command ke clipboard
  const handleCopyCommand = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(index);
      setTimeout(() => setCopiedCommand(null), 2000);
      toast.success("Command copied to clipboard!");
    } catch (error) {
      console.error("Error copying command:", error);
      toast.error("Failed to copy command");
    }
  };

  // ✅ Handle Download dengan Build Popup
  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/user/projects/${id}/download`);
      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started!");

      // ✅ TAMPILKAN BUILD COMMAND POPUP
      const commands = getBuildCommands(project?.slug || "project", osType);
      setBuildCommands(commands);
      setShowBuildDialog(true);
      
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download project");
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: {
        label: "Draft",
        className: "bg-white/5 text-white/50 border-white/15",
      },
      GENERATING: {
        label: "Generating",
        className: "bg-white/10 text-white border-white/20",
      },
      READY: {
        label: "Ready",
        className: "bg-white text-black border-white",
      },
      FAILED: {
        label: "Failed",
        className:
          "bg-white/5 text-white/40 border-white/10 line-through decoration-white/30",
      },
      ARCHIVED: {
        label: "Archived",
        className: "bg-transparent text-white/30 border-white/10",
      },
    };
    const statusInfo = statusMap[status] || statusMap.DRAFT;
    return (
      <Badge
        className={`${statusInfo.className} rounded-full font-medium tracking-tight`}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityMap: Record<string, { label: string; icon: any }> = {
      PRIVATE: { label: "Private", icon: Lock },
      UNLISTED: { label: "Unlisted", icon: Users },
      PUBLIC: { label: "Public", icon: Globe },
    };
    const info = visibilityMap[visibility] || visibilityMap.PRIVATE;
    const Icon = info.icon;
    return (
      <Badge
        variant="outline"
        className="rounded-full text-white/60 border-white/20 font-medium tracking-tight"
      >
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const iconClass = "h-4 w-4 shrink-0";

    switch (ext) {
      case "java":
        return <Coffee className={`${iconClass} text-white`} />;
      case "json":
        return <FileJson className={`${iconClass} text-white/70`} />;
      case "md":
        return <FileText className={`${iconClass} text-white/60`} />;
      case "gradle":
      case "kts":
        return <Terminal className={`${iconClass} text-white/70`} />;
      case "png":
      case "jpg":
      case "jpeg":
      case "svg":
        return <Image className={`${iconClass} text-white/50`} />;
      case "xml":
        return <FileSpreadsheet className={`${iconClass} text-white/60`} />;
      case "properties":
        return <Settings className={`${iconClass} text-white/40`} />;
      case "gitignore":
        return <FileIcon className={`${iconClass} text-white/30`} />;
      default:
        return <File className={`${iconClass} text-white/40`} />;
    }
  };

  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const languages: Record<string, string> = {
      java: "Java",
      json: "JSON",
      md: "Markdown",
      gradle: "Gradle",
      kts: "Kotlin",
      xml: "XML",
      properties: "Properties",
      gitignore: "Git",
      png: "Image",
      jpg: "Image",
      jpeg: "Image",
      svg: "Image",
    };
    return languages[ext || ""] || "Text";
  };

  const getFileSize = (content?: string): string => {
    if (!content) return "0 B";
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes
      .sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node, index) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedFile?.path === node.path;

        if (node.type === "folder") {
          return (
            <div key={index} style={{ paddingLeft: `${level * 16}px` }}>
              <button
                onClick={() => toggleFolder(node.path)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-white/5 text-white/70 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-150" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-150" />
                )}
                <FolderOpen className="h-4 w-4 shrink-0 text-white/50" />
                <span className="truncate font-medium">{node.name}</span>
                <span className="ml-auto text-[10px] text-white/30 font-mono">
                  {node.children?.length || 0}
                </span>
              </button>
              {isExpanded && node.children && (
                <div className="ml-2 border-l border-white/5 pl-2">
                  {renderFileTree(node.children, level + 1)}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={index} style={{ paddingLeft: `${level * 16}px` }}>
            <button
              onClick={() => handleFileClick(node)}
              className={`group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 ${
                isSelected
                  ? "bg-white/[0.07] text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isSelected && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/70" />
              )}
              {getFileIcon(node.name)}
              <span className="truncate">{node.name}</span>
              <span className="ml-auto text-[10px] text-white/30 font-mono opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {getFileSize(node.content)}
              </span>
            </button>
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2.5 text-sm text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
          Loading project…
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <Package className="h-5 w-5 text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/70">Project not found</p>
          <p className="text-xs text-white/30 mt-0.5">
            It may have been deleted or moved.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-white hover:bg-white/10 rounded-md"
          onClick={() => router.push("/user/projects")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  const canEdit = userRole === "OWNER" || userRole === "EDITOR" || session?.user?.role === "ADMIN";

  // ✅ OS Display Name
  const osDisplayName = {
    windows: "Windows",
    mac: "macOS",
    linux: "Linux",
    unknown: "Unknown",
  }[osType] || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/user/projects")}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-md -ml-2 mt-0.5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-sm text-white/40 font-mono">
                {project.slug}
              </span>
              <span className="text-white/15">/</span>
              {getStatusBadge(project.status)}
              {getVisibilityBadge(project.visibility)}
              <span className="text-white/15">/</span>
              <span className="text-xs text-white/40">
                {project.platform} · {project.loader}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-white text-black hover:bg-white/90 rounded-md font-medium"
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </>
            )}
          </Button>

          {canEdit && (
            <Button
              onClick={() => router.push(`/user/projects/${project.id}/edit`)}
              size="sm"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10 rounded-md font-medium"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Files & Structure - Gabungan dengan Project Info */}
      <Card className="bg-black/40 border-white/10 rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4.5 w-4.5 text-white/60" />
              <CardTitle className="text-white text-base font-semibold">
                Project Files
              </CardTitle>
              <CardDescription className="text-white/40 text-xs font-mono">
                {fileStructure.length} items
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              {project.githubRepository && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white hover:bg-white/10 text-xs h-7 rounded-md"
                  onClick={() =>
                    window.open(
                      project.githubRepository?.repositoryUrl,
                      "_blank",
                    )
                  }
                >
                  <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                  View on GitHub
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/10 text-xs h-7 rounded-md"
                onClick={() => {
                  setExpandedFolders(new Set());
                  setTimeout(() => {
                    const allFolders = new Set<string>();
                    const collectFolders = (nodes: FileNode[]) => {
                      for (const node of nodes) {
                        if (node.type === "folder") {
                          allFolders.add(node.path);
                          if (node.children) collectFolders(node.children);
                        }
                      }
                    };
                    collectFolders(fileStructure);
                    setExpandedFolders(allFolders);
                  }, 100);
                }}
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                Expand All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Project Info - Grid 4 items */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-white/5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Layers className="h-3.5 w-3.5" />
                Platform
              </div>
              <p className="mt-1 text-sm font-medium text-white">{project.platform}</p>
              <p className="text-[11px] text-white/30">{project.loader}</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Package className="h-3.5 w-3.5" />
                Package
              </div>
              <p className="mt-1 text-sm font-medium text-white font-mono truncate">
                {project.packageName}
              </p>
              <p className="text-[11px] text-white/30">Mod ID: {project.modId}</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Calendar className="h-3.5 w-3.5" />
                Created
              </div>
              <p className="mt-1 text-sm font-medium text-white">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-white/30">
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <User className="h-3.5 w-3.5" />
                Author
              </div>
              <p className="mt-1 text-sm font-medium text-white truncate">{project.author}</p>
              <p className="text-[11px] text-white/30">v{project.version}</p>
            </div>
          </div>

          {/* File Tree & Content — IDE-style resizable layout */}
          {loadingFiles ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
                Loading files…
              </div>
            </div>
          ) : fileStructure.length > 0 ? (
            <div className="flex flex-col lg:flex-row h-[600px] rounded-lg border border-white/10 overflow-hidden bg-[#0e0e0e]">
              <div
                ref={sidebarRef}
                className="flex flex-col shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5"
                style={{
                  width:
                    typeof window !== "undefined" && window.innerWidth >= 1024
                      ? `${sidebarWidth}px`
                      : "100%",
                }}
              >
                <div className="flex items-center justify-between px-3 h-9 border-b border-white/5 text-[11px] font-semibold text-white/40 uppercase tracking-wider shrink-0">
                  <span>Explorer</span>
                  <span className="text-white/30 font-mono normal-case">
                    {fileStructure.length} items
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto py-2 px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                  {renderFileTree(fileStructure)}
                </div>
              </div>

              <div
                onMouseDown={handleResizerMouseDown}
                className="hidden lg:flex w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-10 transition-colors duration-150 flex-col justify-center items-center group relative border-l border-white/5"
              >
                <div className="w-1 h-8 rounded-full bg-white/20 group-hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
                {selectedFile ? (
                  <>
                    <div className="flex items-center px-4 h-9 border-b border-white/5 bg-[#121212]/80 gap-3 shrink-0">
                      <div className="flex items-center gap-2 border-r border-white/5 pr-3 min-w-0">
                        {getFileIcon(selectedFile.name)}
                        <span className="text-sm font-medium text-white/90 truncate">
                          {selectedFile.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-white/40 border-white/10 rounded-full font-normal shrink-0"
                        >
                          {getFileLanguage(selectedFile.name)}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-white/30 hidden md:block truncate">
                        {selectedFile.path}
                      </span>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white/30 font-mono hidden md:block">
                          {getFileSize(selectedFile.content)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyContent}
                          className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 rounded-md"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                      <pre className="text-[13px] leading-relaxed text-white/70 font-mono whitespace-pre-wrap break-all">
                        {fileContent || (
                          <span className="text-white/20 italic">No content</span>
                        )}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                    <Files className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Select a file to view its content</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <Package className="h-5 w-5 text-white/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/50">
                  No files found
                </p>
                <p className="text-xs text-white/30 mt-1">
                  This project has no files yet. Generate a project to see files
                  here.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10 rounded-md"
                onClick={() => router.push("/user/generator")}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaborators Section */}
      <Card className="bg-black/40 border-white/10 rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-white/60" />
            Collaborators
          </CardTitle>
          <CardDescription className="text-white/40 text-xs">
            Manage who can access and edit this project
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ManageCollaborators
            projectId={project.id}
            projectName={project.name}
            isOwner={project.userId === session?.user?.id}
            isAdmin={session?.user?.role === "ADMIN"}
            onUpdate={fetchProject}
          />
        </CardContent>
      </Card>

      {/* ✅ BUILD COMMAND POPUP */}
      <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Terminal className="h-5 w-5 text-green-400" />
              Build Your Project
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Your project has been downloaded! Follow these commands to build it.
              <span className="block mt-1 text-xs">
                Detected OS: <Badge variant="outline" className="border-white/20 text-white/70">
                  {osDisplayName}
                </Badge>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-black/60 rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/60">Extract and Build</span>
              </div>
              
              <div className="space-y-3">
                {buildCommands.map((command, index) => {
                  const isComment = command.startsWith('#');
                  const isBlank = command.trim() === '';
                  
                  if (isBlank) return <div key={index} className="h-1" />;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-xs text-white/20 font-mono select-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 relative">
                        <pre className={`text-sm font-mono py-2 px-3 rounded-md bg-black/40 border border-white/5 overflow-x-auto ${
                          isComment ? 'text-white/40' : 'text-green-400'
                        }`}>
                          {command}
                        </pre>
                      </div>
                      {!isComment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                          onClick={() => handleCopyCommand(command, index)}
                          title="Copy command"
                        >
                          {copiedCommand === index ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
              <div className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5">⚠️</div>
              <div className="text-xs text-yellow-400/80">
                <p className="font-medium">First time building?</p>
                <p className="mt-1">
                  The first build may take a few minutes as it downloads dependencies.
                  Make sure you have Java 21 installed.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
              <div className="h-5 w-5 text-blue-400 shrink-0 mt-0.5">💡</div>
              <div className="text-xs text-blue-400/80">
                <p className="font-medium">Quick tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Run <code className="bg-black/40 px-1 rounded">./gradlew build</code> to build the mod</li>
                  <li>Run <code className="bg-black/40 px-1 rounded">./gradlew runClient</code> to test in Minecraft</li>
                  <li>Find your mod JAR in <code className="bg-black/40 px-1 rounded">build/libs/</code></li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowBuildDialog(false)}
              className="bg-white text-black hover:bg-white/90"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}