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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-white/60">Repository not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/user/github")}
          className="border-white/10 text-white hover:bg-white/10"
        >
          Back to Repositories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/user/github")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {repository.repositoryName}
            </h1>
            {repository.private ? (
              <Badge variant="outline" className="text-white/40 border-white/10">
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                Public
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/50 mt-1">
            <a
              href={repository.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors flex items-center gap-1"
            >
              {repository.repositoryUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(repository.repositoryUrl, "_blank")}
            className="border-white/10 text-white hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on GitHub
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm text-white/40">Default Branch</p>
                <p className="text-white font-mono text-sm">{repository.defaultBranch}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitCommit className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm text-white/40">Commits</p>
                <p className="text-white font-mono text-sm">{commits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm text-white/40">Branches</p>
                <p className="text-white font-mono text-sm">{branches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm text-white/40">Last Synced</p>
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

      {/* Files & Commits Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList className="bg-black/40 border-white/10">
          <TabsTrigger
            value="files"
            className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white"
          >
            <File className="h-4 w-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger
            value="commits"
            className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white"
          >
            <GitCommit className="h-4 w-4 mr-2" />
            Commits
          </TabsTrigger>
          <TabsTrigger
            value="branches"
            className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Branches
          </TabsTrigger>
        </TabsList>

        {/* FILES TAB — GitHub-style listing */}
        <TabsContent value="files">
          <Card className="bg-black/40 border-white/10 overflow-hidden">
            {/* Breadcrumb */}
            <CardHeader className="pb-2 border-b border-white/5">
              <div className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => goToBreadcrumb(-1)}
                  className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span className="font-mono">{currentBranch}</span>
                </button>
                {breadcrumbSegments.map((seg, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                    <button
                      onClick={() => goToBreadcrumb(i)}
                      className={`hover:text-white transition-colors ${
                        i === breadcrumbSegments.length - 1
                          ? "text-white font-medium"
                          : "text-white/50"
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
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/5 text-sm">
                  <div className="h-6 w-6 rounded-full bg-white/10 overflow-hidden shrink-0">
                    {latestCommit.author?.avatar_url ? (
                      <img
                        src={latestCommit.author.avatar_url}
                        alt={latestCommit.author.login}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white/40 m-auto" />
                    )}
                  </div>
                  <span className="font-semibold text-white/90 shrink-0">
                    {latestCommit.author?.login || latestCommit.commit.author.name}
                  </span>
                  <span className="text-white/60 truncate">
                    {latestCommit.commit.message}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <div className="ml-auto flex items-center gap-3 text-white/40 text-xs shrink-0">
                    <span className="font-mono">{latestCommit.sha.substring(0, 7)}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(latestCommit.commit.author.date), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="flex items-center gap-1 pl-2 border-l border-white/10">
                      <History className="h-3.5 w-3.5" />
                      {commits.length} Commit{commits.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* File/folder table */}
              <div className="divide-y divide-white/5">
                {contentsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                  </div>
                ) : sortedContents.length > 0 ? (
                  sortedContents.map((item) => (
                    <button
                      key={item.sha}
                      onClick={() => handleRowClick(item)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-white/[0.04] transition-colors text-left"
                    >
                      {item.type === "dir" ? (
                        <Folder className="h-4 w-4 shrink-0 text-blue-400" />
                      ) : (
                        <File className="h-4 w-4 shrink-0 text-white/40" />
                      )}
                      <span className="text-white/80 hover:text-white shrink-0">
                        {item.name}
                      </span>
                      {latestCommit && (
                        <span className="text-white/40 truncate hidden sm:inline">
                          {latestCommit.commit.message}
                        </span>
                      )}
                      {latestCommit && (
                        <span className="ml-auto text-white/30 text-xs shrink-0">
                          {formatDistanceToNow(new Date(latestCommit.commit.author.date), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-white/30">
                    <Folder className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-xs">No files</p>
                  </div>
                )}
              </div>

              {/* Selected file content panel */}
              {selectedFile && (
                <div className="border-t border-white/10 bg-[#0a0a0a]">
                  <div className="flex items-center px-4 h-9 border-b border-white/5 bg-[#121212]/80 gap-3">
                    <File className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white/90 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}
                    </span>
                  </div>
                  <div className="max-h-[420px] overflow-auto p-4">
                    <pre className="text-[13px] leading-relaxed text-white/70 font-mono whitespace-pre-wrap break-all">
                      {fileContent || (
                        <span className="text-white/20 italic">
                          Binary file or no content
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMITS TAB */}
        <TabsContent value="commits">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="pt-4">
              {commits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40">
                  <GitCommit className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-sm font-medium">No commits found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commits.map((commit) => (
                    <div
                      key={commit.sha}
                      className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {commit.author?.avatar_url ? (
                          <img
                            src={commit.author.avatar_url}
                            alt={commit.author.login}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-medium text-sm">
                            {commit.commit.author.name}
                          </span>
                          <span className="text-xs text-white/40">
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
                          <code className="text-xs text-white/30 font-mono">
                            {commit.sha.substring(0, 7)}
                          </code>
                          <a
                            href={commit.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/30 hover:text-white/60 transition-colors"
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
        </TabsContent>

        {/* BRANCHES TAB */}
        <TabsContent value="branches">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="pt-4">
              {branches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40">
                  <GitBranch className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-sm font-medium">No branches found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-white/40" />
                        <span className="text-white font-medium">{branch.name}</span>
                        {branch.protected && (
                          <Badge
                            variant="outline"
                            className="text-white/40 border-white/10 text-[10px]"
                          >
                            Protected
                          </Badge>
                        )}
                        {branch.name === repository.defaultBranch && (
                          <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs text-white/30 font-mono">
                        {branch.commit.sha.substring(0, 7)}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}