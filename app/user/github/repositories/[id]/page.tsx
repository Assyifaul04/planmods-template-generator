// app/user/github/repositories/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  File,
  Folder,
  Clock,
  User,
  ExternalLink,
  Loader2,
  ChevronRight,
  GitCommit,
  History,
  CheckCircle2,
  Home,
  RefreshCw,
  Github,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RepositoryDetail {
  id: string;
  repositoryName: string;
  repositoryUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  private: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [repository, setRepository] = useState<RepositoryDetail | null>(null);
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubContent | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [contentsLoading, setContentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("files");

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params;
      fetchRepositoryData(id);
    };
    loadData();
  }, [params]);

  const fetchRepositoryData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/github/repositories/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repository");
      }

      setRepository(data.repository);
      setCurrentBranch(data.repository?.defaultBranch || "main");

      await fetchContents(data.repository);
      await fetchBranches(data.repository);
      await fetchCommits(data.repository);
    } catch (error) {
      console.error("Error fetching repository:", error);
      toast.error("Failed to fetch repository data");
    } finally {
      setLoading(false);
    }
  };

  const fetchContents = async (repo: RepositoryDetail, path: string = "") => {
    try {
      setContentsLoading(true);
      const response = await fetch(
        `/api/user/github/repositories/${repo.id}/contents?path=${encodeURIComponent(path)}`
      );
      const data = await response.json();

      if (data.contents) {
        setContents(data.contents);
      } else {
        setContents([]);
      }
      setCurrentPath(path);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error fetching contents:", error);
      setContents([]);
    } finally {
      setContentsLoading(false);
    }
  };

  const fetchBranches = async (repo: RepositoryDetail) => {
    try {
      const response = await fetch(
        `/api/user/github/repositories/${repo.id}/branches`
      );
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCommits = async (repo: RepositoryDetail) => {
    try {
      const response = await fetch(
        `/api/user/github/repositories/${repo.id}/commits`
      );
      const data = await response.json();
      setCommits(data.commits || []);
    } catch (error) {
      console.error("Error fetching commits:", error);
    }
  };

  const fetchFileContent = async (repo: RepositoryDetail, file: GitHubContent) => {
    try {
      const response = await fetch(
        `/api/user/github/repositories/${repo.id}/contents?path=${encodeURIComponent(file.path)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedFile(file);

      if (data.content) {
        setFileContent(data.content);
      } else {
        setFileContent("// No content available");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      setFileContent(`// Error loading file: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error("Failed to fetch file content");
    }
  };

  const handleRowClick = (item: GitHubContent) => {
    if (!repository) return;
    if (item.type === "dir") {
      fetchContents(repository, item.path);
    } else {
      fetchFileContent(repository, item);
    }
  };

  const goToBreadcrumb = (index: number) => {
    if (!repository) return;
    if (index === -1) {
      fetchContents(repository, "");
      return;
    }
    const segments = currentPath.split("/").filter(Boolean);
    const newPath = segments.slice(0, index + 1).join("/");
    fetchContents(repository, newPath);
  };

  const latestCommit = commits[0];
  const sortedContents = [...contents].sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1;
    if (a.type !== "dir" && b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
  });
  const breadcrumbSegments = currentPath.split("/").filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <GithubIcon className="h-16 w-16 text-zinc-600" />
        <p className="text-white/60">Repository not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/user/github")}
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Back to Repositories
        </Button>
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return renderFiles();
      case "commits":
        return renderCommits();
      case "branches":
        return renderBranches();
      default:
        return null;
    }
  };

  const renderFiles = () => (
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
      {/* Breadcrumb */}
      <CardHeader className="pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => goToBreadcrumb(-1)}
            className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="font-mono">{currentBranch}</span>
          </button>
          {breadcrumbSegments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              <button
                onClick={() => goToBreadcrumb(i)}
                className={`hover:text-white transition-colors ${
                  i === breadcrumbSegments.length - 1
                    ? "text-white font-medium"
                    : "text-zinc-500"
                }`}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Latest commit bar */}
        {latestCommit && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/30 border-b border-zinc-800 text-sm">
            <div className="h-6 w-6 rounded-full bg-zinc-800 overflow-hidden shrink-0">
              {latestCommit.author?.avatar_url ? (
                <img
                  src={latestCommit.author.avatar_url}
                  alt={latestCommit.author.login}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-zinc-500 m-auto" />
              )}
            </div>
            <span className="font-semibold text-white/90 shrink-0">
              {latestCommit.author?.login || latestCommit.commit.author.name}
            </span>
            <span className="text-zinc-400 truncate">
              {latestCommit.commit.message}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <div className="ml-auto flex items-center gap-3 text-zinc-500 text-xs shrink-0">
              <span className="font-mono">{latestCommit.sha.substring(0, 7)}</span>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(latestCommit.commit.author.date), {
                  addSuffix: true,
                })}
              </span>
              <span className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                <History className="h-3.5 w-3.5" />
                {commits.length} Commit{commits.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* File/folder table */}
        <div className="divide-y divide-zinc-800">
          {contentsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : sortedContents.length > 0 ? (
            sortedContents.map((item) => (
              <button
                key={item.sha}
                onClick={() => handleRowClick(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-800/50 transition-colors text-left"
              >
                {item.type === "dir" ? (
                  <Folder className="h-4 w-4 shrink-0 text-blue-400" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-zinc-500" />
                )}
                <span className="text-white/80 hover:text-white shrink-0">
                  {item.name}
                </span>
                {latestCommit && (
                  <span className="text-zinc-500 truncate hidden sm:inline">
                    {latestCommit.commit.message}
                  </span>
                )}
                {latestCommit && (
                  <span className="ml-auto text-zinc-500 text-xs shrink-0">
                    {formatDistanceToNow(new Date(latestCommit.commit.author.date), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <Folder className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-xs">No files</p>
            </div>
          )}
        </div>

        {/* Selected file content panel */}
        {selectedFile && (
          <div className="border-t border-zinc-800 bg-black">
            <div className="flex items-center px-4 h-9 border-b border-zinc-800 bg-zinc-900/50 gap-3">
              <File className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-white/90 truncate">
                {selectedFile.name}
              </span>
              <span className="text-[10px] text-zinc-500">
                {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}
              </span>
            </div>
            <div className="max-h-[420px] overflow-auto p-4">
              <pre className="text-[13px] leading-relaxed text-white/70 font-mono whitespace-pre-wrap break-all">
                {fileContent || (
                  <span className="text-zinc-500 italic">
                    Binary file or no content
                  </span>
                )}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCommits = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="pt-4">
        {commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCommit className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-white font-medium">No commits found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commits.map((commit) => (
              <div
                key={commit.sha}
                className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {commit.author?.avatar_url ? (
                    <img
                      src={commit.author.avatar_url}
                      alt={commit.author.login}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      {commit.commit.author.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      committed{" "}
                      {formatDistanceToNow(new Date(commit.commit.author.date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 truncate">
                    {commit.commit.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-zinc-500 font-mono">
                      {commit.sha.substring(0, 7)}
                    </code>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderBranches = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="pt-4">
        {branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-white font-medium">No branches found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GitBranch className="h-4 w-4 text-zinc-500" />
                  <span className="text-white font-medium">{branch.name}</span>
                  {branch.protected && (
                    <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px]">
                      Protected
                    </Badge>
                  )}
                  {branch.name === repository.defaultBranch && (
                    <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                      Default
                    </Badge>
                  )}
                </div>
                <code className="text-xs text-zinc-500 font-mono">
                  {branch.commit.sha.substring(0, 7)}
                </code>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/user/github")}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 px-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <GithubIcon className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {repository.repositoryName}
                  </h1>
                  {repository.private ? (
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-500 mt-1 ml-12">
                <a
                  href={repository.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  {repository.repositoryUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(repository.repositoryUrl, "_blank")}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Default Branch</p>
                  <p className="text-white font-mono text-sm">{repository.defaultBranch}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitCommit className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Commits</p>
                  <p className="text-white font-mono text-sm">{commits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Branches</p>
                  <p className="text-white font-mono text-sm">{branches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Last Synced</p>
                  <p className="text-white font-mono text-sm">
                    {repository.lastSyncedAt
                      ? formatDistanceToNow(new Date(repository.lastSyncedAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-800 mb-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "files"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <File className="h-4 w-4" />
              Files
            </button>
            <button
              onClick={() => setActiveTab("commits")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "commits"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <GitCommit className="h-4 w-4" />
              Commits
            </button>
            <button
              onClick={() => setActiveTab("branches")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "branches"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <GitBranch className="h-4 w-4" />
              Branches
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}