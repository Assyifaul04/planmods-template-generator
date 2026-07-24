// app/user/generator/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FolderTree,
  File,
  FileJson,
  FileText,
  Package,
  Sparkles,
  FolderOpen,
  Download,
  Copy,
  Check,
  Terminal,
  CheckCircle,
  Settings2,
  GitBranch,
  User,
  Calendar,
  Layers,
  Tag,
  ChevronRight,
  ChevronDown,
  Folder,
  X,
  FolderPlus,
  FilePlus,
  XCircle,
  PartyPopper,
  Coffee,
  GitBranch as GitBranchIcon,
  Files,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";
import { GitHubSuccessDialog } from "@/components/github/GitHubSuccessDialog";

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
  apiVersion?: string;
  loomVersion?: string;
  gradleVersion?: string;
  javaVersion?: string;
  jdkVersion?: string;
  mappingsVersion?: string;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: "JAVA" | "BEDROCK";
  loader: string;
  minecraftVersion: string;
  path: string;
  templateRepo: {
    id: string;
    repoUrl: string;
  } | null;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
}

interface LogEntry {
  type: "log" | "file" | "folder" | "done" | "error";
  message?: string;
  path?: string;
  name?: string;
  content?: string;
  size?: number;
}

const LOADER_OPTIONS = {
  JAVA: [
    { id: "FABRIC", name: "Fabric" },
    { id: "FORGE", name: "Forge" },
    { id: "NEOFORGE", name: "NeoForge" },
    { id: "QUILT", name: "Quilt" },
    { id: "PAPER", name: "Paper" },
    { id: "SPIGOT", name: "Spigot" },
    { id: "PURPUR", name: "Purpur" },
    { id: "FOLIA", name: "Folia" },
    { id: "VELOCITY", name: "Velocity" },
    { id: "WATERFALL", name: "Waterfall" },
    { id: "BUNGEECORD", name: "BungeeCord" },
  ],
  BEDROCK: [
    { id: "ADDON", name: "Addon" },
    { id: "SCRIPT", name: "Script API" },
  ],
} as const;

type Platform = "JAVA" | "BEDROCK";

const SUPPORTED_LOADERS = new Set(["FABRIC", "FORGE", "NEOFORGE", "QUILT"]);

const LOADER_COMPATIBILITY: Record<string, string[]> = {
  FABRIC: ["1.14", "1.15", "1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  FORGE: ["1.14", "1.15", "1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  NEOFORGE: ["1.20", "1.21"],
  QUILT: ["1.18", "1.19", "1.20", "1.21"],
  PAPER: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  SPIGOT: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  PURPUR: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  FOLIA: ["1.19", "1.20", "1.21"],
  VELOCITY: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  WATERFALL: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  BUNGEECORD: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  ADDON: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
  SCRIPT: ["1.16", "1.17", "1.18", "1.19", "1.20", "1.21"],
};

function findFirstFile(nodes: FileNode[]): FileNode | null {
  for (const node of nodes) {
    if (node.type === "file" && node.content) return node;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

function buildFileTree(items: { path: string; content?: string; isFolder?: boolean }[]): FileNode[] {
  const root: FileNode[] = [];

  items.forEach((item) => {
    const parts = item.path.split(/[\\/]/);
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        const isFolderNode = !isLast || item.isFolder;

        node = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFolderNode ? "folder" : "file",
          children: isFolderNode ? [] : undefined,
        };

        if (!isFolderNode) {
          node.content = item.content;
        }

        currentLevel.push(node);
      }

      if (node.children) {
        currentLevel = node.children;
      }
    });
  });

  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        if (node.children) {
          node.children = sortNodes(node.children);
        }
        return node;
      });
  };

  return sortNodes(root);
}

function getAllFolderPaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  nodes.forEach((node) => {
    if (node.type === "folder") {
      paths.push(node.path || node.name);
      if (node.children) {
        paths.push(...getAllFolderPaths(node.children));
      }
    }
  });
  return paths;
}

export default function GeneratePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loaderVersions, setLoaderVersions] = useState<LoaderMinecraftVersion[]>([]);
  const [flatFiles, setFlatFiles] = useState<{ path: string; content?: string; isFolder?: boolean }[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLogPopup, setShowLogPopup] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [gitHubData, setGitHubData] = useState<{
    repoUrl: string;
    cloneUrl: string;
    gitCommands: string[];
    message: string;
    downloadUrl?: string;
  } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [autoScroll, setAutoScroll] = useState(true);
  const [versionWarning, setVersionWarning] = useState<string | null>(null);
  const [isVersionCompatible, setIsVersionCompatible] = useState(true);

  const logEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hidePopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    platform: "JAVA" as Platform,
    loader: "FABRIC" as string,
    minecraftVersion: "",
    loaderMinecraftVersionId: "",
    templateId: "",
    packageName: "",
    modId: "",
    author: session?.user?.name || "",
    version: "1.0.0",
    customLoaderVersion: "",
    customApiVersion: "",
    customLoomVersion: "",
    customJavaVersion: "",
    customGradleVersion: "",
    customMappingsVersion: "",
  });

  const availableLoaders = LOADER_OPTIONS[formData.platform] || [];
  
  // ✅ FILTER VERSI YANG VALID DARI DATABASE
  const validVersions = versions.filter((v) => v.platform === formData.platform);
  
  const filteredLoaderVersions = loaderVersions.filter((lv) => lv.loader === formData.loader);
  const filteredTemplates = templates.filter(
    (t) =>
      t.platform === formData.platform &&
      t.loader === formData.loader &&
      t.minecraftVersion === formData.minecraftVersion,
  );

  const canGenerateDirectly = SUPPORTED_LOADERS.has(formData.loader);

  // Resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !sidebarRef.current) return;
      const containerLeft = sidebarRef.current.parentElement?.getBoundingClientRect().left || 0;
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

  // ✅ Validasi kompatibilitas versi
  useEffect(() => {
    if (formData.loader && formData.minecraftVersion) {
      const compatibleVersions = LOADER_COMPATIBILITY[formData.loader] || [];
      const isCompatible = compatibleVersions.some((v) => 
        formData.minecraftVersion.startsWith(v)
      );
      
      setIsVersionCompatible(isCompatible);
      
      if (!isCompatible) {
        setVersionWarning(
          `${formData.loader} may not be fully compatible with Minecraft ${formData.minecraftVersion}. ` +
          `Recommended versions: ${compatibleVersions.join(', ')}`
        );
      } else {
        setVersionWarning(null);
      }
    } else {
      setIsVersionCompatible(true);
      setVersionWarning(null);
    }
  }, [formData.loader, formData.minecraftVersion]);

  // Fetch data
  useEffect(() => {
    fetchVersions();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (formData.loader && formData.minecraftVersion) {
      fetchLoaderVersions();
    } else {
      setLoaderVersions([]);
    }
  }, [formData.loader, formData.minecraftVersion]);

  useEffect(() => {
    if (formData.name) {
      const slug = slugify(formData.name, { lower: true, strict: true });
      const cleanName = slugify(formData.name, { lower: true, strict: true }).replace(/-/g, "");

      setFormData((prev) => ({
        ...prev,
        slug,
        packageName: `com.${cleanName}.mod`,
        modId: cleanName || "mod",
      }));
    }
  }, [formData.name]);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    if (fileStructure.length > 0) {
      const allFolders = getAllFolderPaths(fileStructure);
      setExpandedFolders(new Set(allFolders));
    }
  }, [fileStructure]);

  const fetchVersions = async () => {
    try {
      const response = await fetch("/api/user/versions");
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to fetch versions");
    }
  };

  const fetchLoaderVersions = async () => {
    try {
      const version = versions.find((v) => v.version === formData.minecraftVersion);
      if (!version) return;

      const params = new URLSearchParams({ loader: formData.loader, versionId: version.id });
      const response = await fetch(`/api/user/versions/mappings?${params.toString()}`);
      const data = await response.json();
      setLoaderVersions(data || []);
    } catch (error) {
      console.error("Error fetching loader versions:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/user/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "platform") {
        updated.loader = "";
        updated.minecraftVersion = "";
        updated.templateId = "";
        updated.loaderMinecraftVersionId = "";
        updated.customLoaderVersion = "";
        updated.customApiVersion = "";
        updated.customLoomVersion = "";
        updated.customJavaVersion = "";
        updated.customGradleVersion = "";
        updated.customMappingsVersion = "";
        setLoaderVersions([]);
        setVersionWarning(null);
        setIsVersionCompatible(true);
      }
      if (name === "loader" || name === "minecraftVersion") {
        updated.templateId = "";
        updated.loaderMinecraftVersionId = "";
        updated.customLoaderVersion = "";
        updated.customApiVersion = "";
        updated.customLoomVersion = "";
        updated.customJavaVersion = "";
        updated.customGradleVersion = "";
        updated.customMappingsVersion = "";
      }
      if (name === "loaderMinecraftVersionId") {
        const detail = loaderVersions.find((lv) => lv.id === value);
        updated.customLoaderVersion = detail?.loaderVersion || "";
        updated.customApiVersion = detail?.apiVersion || "";
        updated.customLoomVersion = detail?.loomVersion || "";
        updated.customJavaVersion = detail?.javaVersion || "";
        updated.customGradleVersion = detail?.gradleVersion || "";
        updated.customMappingsVersion = detail?.mappingsVersion || "";
      }
      return updated;
    });
    setFileStructure([]);
    setSelectedFile(null);
    setLogs([]);
    setGenerationComplete(false);
    setFlatFiles([]);
    setExpandedFolders(new Set());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleGenerate = async () => {
    if (!formData.templateId || !formData.name) {
      toast.error("Please fill in required fields (Name and Template)");
      return;
    }

    if (!isVersionCompatible) {
      toast.warning("Version compatibility warning", {
        description: versionWarning,
        duration: 6000,
      });
    }

    if (hidePopupTimeoutRef.current) clearTimeout(hidePopupTimeoutRef.current);

    setGenerating(true);
    setShowLogPopup(true);
    setFileStructure([]);
    setSelectedFile(null);
    setLogs([]);
    setGenerationComplete(false);
    setTotalFiles(0);
    setFlatFiles([]);
    setExpandedFolders(new Set());

    try {
      const response = await fetch("/api/user/generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok || !response.body) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate project");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const currentItems: { path: string; content?: string; isFolder?: boolean }[] = [];

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

          setLogs((prev) => [...prev, event]);

          if (event.type === "file") {
            currentItems.push({ path: event.path, content: event.content || "", isFolder: false });
            setTotalFiles((prev) => prev + 1);
          } else if (event.type === "folder") {
            currentItems.push({ path: event.path, isFolder: true });
          }

          if (event.type === "done") {
            setGenerating(false);
            setGenerationComplete(true);

            const tree = buildFileTree(currentItems);
            setFileStructure(tree);
            setFlatFiles(currentItems);

            const allFolders = getAllFolderPaths(tree);
            setExpandedFolders(new Set(allFolders));

            const firstFile = findFirstFile(tree);
            if (firstFile) {
              setSelectedFile(firstFile);
            }

            toast.success(`Project generated! (${event.totalFiles} files)`);
            hidePopupTimeoutRef.current = setTimeout(() => setShowLogPopup(false), 900);
          }

          if (event.type === "error") {
            toast.error(event.message);
            setGenerating(false);
            hidePopupTimeoutRef.current = setTimeout(() => setShowLogPopup(false), 1500);
          }
        }
      }
    } catch (error) {
      console.error("Error generating project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate project");
      setGenerating(false);
      hidePopupTimeoutRef.current = setTimeout(() => setShowLogPopup(false), 1200);
    }
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type !== "file") return;
    setSelectedFile(file);
  };

  const handleCopyContent = async () => {
    if (!selectedFile?.content) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  const handleDownloadZip = () => {
    if (!gitHubData?.downloadUrl) {
      toast.error("Download URL not available");
      return;
    }
    window.open(gitHubData.downloadUrl, "_blank");
    toast.success("Download started!");
  };

  const handleDownload = async () => {
    if (!formData.templateId || !fileStructure.length || isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch("/api/user/generator/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: formData.slug, templateId: formData.templateId }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.needGitHubAuth) {
          toast.error("Please connect your GitHub account first");
          return;
        }
        throw new Error(error.error || "Failed to download");
      }

      const data = await response.json();
      if (data.repositoryCreated && data.gitCommands) {
        setGitHubData({
          repoUrl: data.repoUrl,
          cloneUrl: data.cloneUrl,
          gitCommands: data.gitCommands,
          message: data.message,
          downloadUrl: data.downloadUrl,
        });
        setShowGitHubDialog(true);
        toast.success(`✅ Repository created: ${data.repoUrl}`);
      } else if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
        toast.success("Download started!");
      } else {
        toast.info(data.message || "Project processed successfully");
      }
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error(error instanceof Error ? error.message : "Failed to download project");
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const iconClass = "h-4 w-4 shrink-0";
    switch (ext) {
      case "java": return <Coffee className={`${iconClass} text-orange-400`} />;
      case "json": return <FileJson className={`${iconClass} text-yellow-400`} />;
      case "md": return <FileText className={`${iconClass} text-blue-400`} />;
      case "gradle": case "kts": return <Terminal className={`${iconClass} text-purple-400`} />;
      case "xml": return <FileText className={`${iconClass} text-red-400`} />;
      case "properties": return <FileText className={`${iconClass} text-green-400`} />;
      case "png": case "jpg": case "jpeg": case "svg": return <File className={`${iconClass} text-blue-300`} />;
      default: return <File className={`${iconClass} text-white/40`} />;
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
      properties: "Properties" 
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
      .slice()
      .sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedFile?.path === node.path;

        if (node.type === "folder") {
          return (
            <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
              <button
                onClick={() => toggleFolder(node.path)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-white/5 text-white/70 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-150" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-150" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-blue-400/60" />
                )}
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
          <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
            <button
              onClick={() => handleFileClick(node)}
              className={`group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 ${
                isSelected
                  ? "bg-white/[0.07] text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isSelected && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
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

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <GitHubSuccessDialog
        open={showGitHubDialog}
        onOpenChange={setShowGitHubDialog}
        repoUrl={gitHubData?.repoUrl || ""}
        cloneUrl={gitHubData?.cloneUrl || ""}
        gitCommands={gitHubData?.gitCommands || []}
        projectName={formData.name || "Project"}
        projectId={formData.slug}
        onDownload={handleDownloadZip}
        isDownloading={isDownloading}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Generate Project</h1>
          <p className="text-sm text-white/50 mt-1">Create a new Minecraft mod project from a template</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={!fileStructure.length || generating || isDownloading}
            className="bg-white text-black hover:bg-white/90 font-medium disabled:opacity-40"
          >
            {isDownloading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Deploy to GitHub</>
            )}
          </Button>
          <Button
            onClick={() => router.push("/user/projects")}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/10"
          >
            <FolderTree className="h-4 w-4 mr-2" />My Projects
          </Button>
        </div>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader className="pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-white/40" />
                Project Configuration
              </CardTitle>
              <CardDescription className="text-white/40 text-xs">
                Configure your project details before generation
              </CardDescription>
            </div>
            {formData.loader && formData.minecraftVersion && (
              <div className="flex items-center gap-2">
                {isVersionCompatible ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Compatible
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Version Warning
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {versionWarning && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">Version Compatibility Warning</p>
                <p className="text-xs text-yellow-400/70">{versionWarning}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <Tag className="h-3.5 w-3.5" />Basic Info
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/90 text-sm">
                  Project Name <span className="text-white/40">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Blaze Sword"
                  className="bg-white/5 border-white/10 text-white h-10 text-sm focus-visible:ring-white/20"
                />
                <p className="text-[11px] text-white/40">
                  Used to generate your package name, mod ID, and slug automatically.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Package className="h-3 w-3" />Package Name
                  </Label>
                  <Input
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleInputChange}
                    className="bg-white/[0.03] border-white/10 text-white/70 h-10 text-sm font-mono cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Layers className="h-3 w-3" />Mod ID
                  </Label>
                  <Input
                    name="modId"
                    value={formData.modId}
                    onChange={handleInputChange}
                    className="bg-white/[0.03] border-white/10 text-white/70 h-10 text-sm font-mono cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                    <User className="h-3 w-3" />Author
                  </Label>
                  <Input
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Calendar className="h-3 w-3" />Version
                  </Label>
                  <Input
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="1.0.0"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Platform & Environment */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <Boxes className="h-3.5 w-3.5" />Platform & Environment
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Platform <span className="text-white/40">*</span></Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => handleSelectChange("platform", value as Platform)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="JAVA">Java</SelectItem>
                      <SelectItem value="BEDROCK">Bedrock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm">Loader <span className="text-white/40">*</span></Label>
                  <Select
                    value={formData.loader}
                    onValueChange={(value) => handleSelectChange("loader", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      {availableLoaders.map((loader) => (
                        <SelectItem key={loader.id} value={loader.id}>
                          {loader.name}
                          {!SUPPORTED_LOADERS.has(loader.id) && (
                            <span className="ml-2 text-[10px] text-white/30">(clone only)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-white/30">
                    {canGenerateDirectly 
                      ? `✅ ${formData.loader} can be generated directly`
                      : `ℹ️ ${formData.loader} requires cloning from GitHub`}
                  </p>
                </div>
              </div>

              {/* ✅ MINECRAFT VERSION DROPDOWN - HANYA VERSI VALID DARI DATABASE */}
              <div className="space-y-1.5">
                <Label className="text-white/90 text-sm">
                  Minecraft Version <span className="text-white/40">*</span>
                  <span className="ml-2 text-[10px] text-white/30">
                    ({validVersions.length} versions available)
                  </span>
                </Label>
                <Select
                  value={formData.minecraftVersion}
                  onValueChange={(value) => handleSelectChange("minecraftVersion", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white max-h-[300px]">
                    {validVersions.length === 0 ? (
                      <div className="p-4 text-center text-white/40 text-xs">
                        No versions available. Please run sync script.
                      </div>
                    ) : (
                      validVersions.map((v) => {
                        const compatible = LOADER_COMPATIBILITY[formData.loader]?.some(
                          (c) => v.version.startsWith(c)
                        ) ?? true;
                        return (
                          <SelectItem key={v.id} value={v.version}>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm ${!compatible ? 'text-yellow-400/60' : ''}`}>
                                {v.version}
                              </span>
                              {v.isLatest && (
                                <Badge className="bg-white text-black border-white text-[10px]">
                                  Latest
                                </Badge>
                              )}
                              {v.isSnapshot && (
                                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
                                  Snapshot
                                </Badge>
                              )}
                              {!compatible && (
                                <AlertCircle className="h-3 w-3 text-yellow-400/60" />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {formData.minecraftVersion && !validVersions.some(v => v.version === formData.minecraftVersion) && (
                  <p className="text-[10px] text-red-400">
                    ⚠️ Version "{formData.minecraftVersion}" is not in the database. Please select from the list.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/90 text-sm">Template <span className="text-white/40">*</span></Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => handleSelectChange("templateId", value)}
                  disabled={!formData.loader || !formData.minecraftVersion}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder={!formData.loader || !formData.minecraftVersion 
                      ? "Select loader and version first" 
                      : "Select Template"} 
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white max-h-[200px]">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <span>{t.name}</span>
                            {t.description && (
                              <span className="text-xs text-white/40 truncate max-w-[150px]">
                                {t.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-white/40 text-xs">
                        {formData.loader && formData.minecraftVersion 
                          ? "No templates available for this configuration"
                          : "Select loader and version first"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column 3: Loader Config */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <GitBranchIcon className="h-3.5 w-3.5" />Loader Configuration
              </div>

              {formData.loader && formData.minecraftVersion && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-white/90 text-sm">Load Config from Preset</Label>
                    <Select
                      value={formData.loaderMinecraftVersionId}
                      onValueChange={(value) => handleSelectChange("loaderMinecraftVersionId", value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                        <SelectValue placeholder="Select Preset (Optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10 text-white max-h-[200px]">
                        {filteredLoaderVersions.length > 0 ? (
                          filteredLoaderVersions.map((lv) => (
                            <SelectItem key={lv.id} value={lv.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{lv.loaderVersion}</span>
                                {lv.recommended && (
                                  <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
                                    Recommended
                                  </Badge>
                                )}
                                {!lv.supported && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                                    Not Supported
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-white/50 text-xs">
                            No presets available for this version
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-3">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Manual Configuration
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">Loader Version</Label>
                        <Input
                          name="customLoaderVersion"
                          value={formData.customLoaderVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 0.16.9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">API Version</Label>
                        <Input
                          name="customApiVersion"
                          value={formData.customApiVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 0.91.1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">Loom Version</Label>
                        <Input
                          name="customLoomVersion"
                          value={formData.customLoomVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 1.7.4"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">Java Version</Label>
                        <Input
                          name="customJavaVersion"
                          value={formData.customJavaVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 17"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">Gradle Version</Label>
                        <Input
                          name="customGradleVersion"
                          value={formData.customGradleVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 8.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-white/60">Mappings</Label>
                        <Input
                          name="customMappingsVersion"
                          value={formData.customMappingsVersion}
                          onChange={handleInputChange}
                          className="h-8 text-xs bg-black/40 border-white/10"
                          placeholder="e.g. 2023.12.10"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating || !formData.templateId || !formData.name || !isVersionCompatible}
                className="w-full bg-white text-black hover:bg-white/90 h-10 font-medium mt-2"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Generate Project</>
                )}
              </Button>
              {!isVersionCompatible && formData.loader && formData.minecraftVersion && (
                <p className="text-[10px] text-yellow-400 text-center">
                  ⚠️ Please select a compatible version or use Clone from GitHub
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Explorer - sama seperti sebelumnya */}
      <Card className="bg-black/40 border-white/10 overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-white/60" />
              <CardTitle className="text-white text-sm font-medium">Project Files</CardTitle>
              {fileStructure.length > 0 && (
                <span className="text-xs text-white/30">({totalFiles} files)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {generationComplete && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />Done
                </div>
              )}
              {fileStructure.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allFolders = getAllFolderPaths(fileStructure);
                      setExpandedFolders(new Set(allFolders));
                    }}
                    className="text-white/40 hover:text-white/60 h-7 text-xs"
                  >
                    Expand All
                  </Button>
                  {expandedFolders.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedFolders(new Set())}
                      className="text-white/40 hover:text-white/60 h-7 text-xs"
                    >
                      Collapse All
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <CardDescription className="text-white/40 text-xs">
            {formData.name || "Unnamed"} · {formData.platform} · {formData.loader} · {formData.minecraftVersion || "No version"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row h-[600px] bg-[#0e0e0e]">
            <div
              ref={sidebarRef}
              className="flex flex-col shrink-0 bg-[#121212] border-b lg:border-b-0 lg:border-r border-white/5"
              style={{
                width: typeof window !== "undefined" && window.innerWidth >= 1024
                  ? `${sidebarWidth}px`
                  : "100%",
              }}
            >
              <div className="flex items-center justify-between px-3 h-9 border-b border-white/5 text-[11px] font-semibold text-white/40 uppercase tracking-wider shrink-0">
                <span>Explorer</span>
                {fileStructure.length > 0 && (
                  <span className="text-white/30 font-mono normal-case">{totalFiles} files</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto py-2 px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {fileStructure.length > 0 ? (
                  renderFileTree(fileStructure)
                ) : generating ? (
                  <div className="flex flex-col items-center justify-center py-10 text-white/30 text-center px-2">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <p className="text-xs">Generating files...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-white/30 text-center px-2">
                    <Package className="h-6 w-6 mb-2" />
                    <p className="text-xs">No project yet</p>
                    <p className="text-xs text-white/20">Configure and generate to see files</p>
                  </div>
                )}
              </div>
            </div>

            <div
              onMouseDown={handleResizerMouseDown}
              className="hidden lg:flex w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-10 transition-colors duration-150 flex-col justify-center items-center group relative"
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
                      {selectedFile.content || (
                        <span className="text-white/20 italic">No content</span>
                      )}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                  <Files className="h-16 w-16 opacity-20" />
                  <p className="text-sm font-medium">Click a file to view its content</p>
                  {fileStructure.length === 0 && !generating && (
                    <p className="text-xs text-white/20">
                      Generate a project to see files here
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Popup */}
      {showLogPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    generationComplete ? "bg-green-500" : generating ? "bg-white/10" : "bg-red-500/20"
                  }`}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                  ) : generationComplete ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {generating
                      ? "Generating project"
                      : generationComplete
                      ? "Generation complete"
                      : "Generation stopped"}
                  </p>
                  <p className="text-xs text-white/40">
                    {formData.name || "Untitled project"} · {totalFiles} file
                    {totalFiles === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogPopup(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-white/[0.02] px-2 py-2 font-mono text-[12.5px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 text-white/35">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Initializing…</span>
                </div>
              ) : (
                <>
                  {logs.map((log, idx) => {
                    const isError = log.type === "error";
                    const isDone = log.type === "done";
                    const isFileLog = log.type === "file";
                    const isFolderLog = log.type === "folder";
                    const Icon = isError
                      ? XCircle
                      : isDone
                      ? PartyPopper
                      : isFileLog
                      ? FilePlus
                      : isFolderLog
                      ? FolderPlus
                      : Terminal;
                    const iconColor = isError
                      ? "text-red-400"
                      : isDone
                      ? "text-yellow-400"
                      : "text-white/30";
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 rounded-md px-3 py-1 ${
                          isError ? "bg-red-500/[0.06]" : ""
                        }`}
                      >
                        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                        <span
                          className={`min-w-0 flex-1 truncate ${
                            isError
                              ? "text-red-300"
                              : isDone
                              ? "text-white"
                              : "text-white/60"
                          }`}
                        >
                          {isFileLog ? (
                            <>
                              <span className="text-white/80">{log.name}</span>
                              {typeof log.size === "number" && (
                                <span className="ml-2 text-white/30">{log.size} bytes</span>
                              )}
                            </>
                          ) : isFolderLog ? (
                            <span className="text-white/80">{log.name}</span>
                          ) : (
                            <span>{log.message || log.path || log.name || ""}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {generating && (
                    <div className="flex items-center gap-2.5 px-3 py-1.5 text-white/30">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing…</span>
                    </div>
                  )}
                </>
              )}
              <div ref={logEndRef} />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  autoScroll
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                Auto-scroll {autoScroll ? "on" : "off"}
              </button>
              {generationComplete && !generating && (
                <span className="flex items-center gap-1.5 text-xs text-white/50">
                  <Check className="h-3.5 w-3.5" />
                  All files generated successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}