// app/user/github/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GitBranch,
  GitPullRequest,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Plus,
  Link,
  Unlink,
  AlertCircle,
  Rocket,
  Loader2,
  FolderGit2,
  ChevronRight,
  Code2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { GitHubSuccessDialog } from "@/components/github/GitHubSuccessDialog";

interface Repository {
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

interface ConnectedAccount {
  provider: string;
  providerAccountId: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  platform: string;
  loader: string;
  status: string;
  githubRepository: Repository | null;
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

export default function GitHubPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("projects");

  // State untuk Dialog Deploy
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployRepoName, setDeployRepoName] = useState("");
  const [deployPrivate, setDeployPrivate] = useState(true);

  // State untuk Alert Dialog Disconnect
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [disconnectTargetId, setDisconnectTargetId] = useState<string | null>(null);

  // State untuk GitHub Success Dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [gitHubData, setGitHubData] = useState<{
    repoUrl: string;
    cloneUrl: string;
    gitCommands: string[];
    message: string;
    downloadUrl?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRepositories(),
        fetchAccounts(),
        fetchProjects(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const response = await fetch("/api/user/github/repositories");
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories");
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/user/github/accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
      setConnectedProviders(data.connectedAccounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/user/projects");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    }
  };

  const handleSync = async (repositoryId: string) => {
    try {
      setSyncing(repositoryId);
      const response = await fetch("/api/user/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync");
      }

      toast.success("Repository synced successfully!");
      await fetchRepositories();
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync");
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnectClick = (repositoryId: string) => {
    setDisconnectTargetId(repositoryId);
    setShowDisconnectDialog(true);
  };

  const confirmDisconnect = async () => {
    if (!disconnectTargetId) return;

    try {
      const response = await fetch(
        `/api/user/github/repositories/${disconnectTargetId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect");
      }

      toast.success("Repository disconnected successfully!");
      await fetchRepositories();
      await fetchProjects();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    } finally {
      setDisconnectTargetId(null);
      setShowDisconnectDialog(false);
    }
  };

  const handleDeploy = async (project: Project) => {
    if (!connectedProviders.includes("github")) {
      toast.error("Please connect your GitHub account first");
      return;
    }

    setSelectedProject(project);
    setDeployRepoName(
      project.slug || project.name.toLowerCase().replace(/\s+/g, "-"),
    );
    setShowDeployDialog(true);
  };

  const confirmDeploy = async () => {
    if (!selectedProject || !deployRepoName) return;

    try {
      setDeploying(selectedProject.id);
      setShowDeployDialog(false);

      const response = await fetch("/api/user/github/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          repoName: deployRepoName,
          private: deployPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deploy");
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, githubRepository: data.repository }
            : p,
        ),
      );

      setGitHubData({
        repoUrl: data.repoUrl,
        cloneUrl: data.cloneUrl,
        gitCommands: data.gitCommands || [],
        message: data.message,
        downloadUrl: data.downloadUrl,
      });

      setShowSuccessDialog(true);
      toast.success(`Repository "${deployRepoName}" created successfully!`);

      await fetchRepositories();
      await fetchProjects();
    } catch (error) {
      console.error("Error deploying:", error);
      toast.error(error instanceof Error ? error.message : "Failed to deploy");
    } finally {
      setDeploying(null);
    }
  };

  const getStatusBadge = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) {
      return (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Synced
        </Badge>
      );
    }

    const diff = Date.now() - new Date(lastSyncedAt).getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Synced
        </Badge>
      );
    } else if (hours < 24) {
      return (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(hours)} hours ago
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-white/40 border-white/10">
          <Clock className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  const isGitHubConnected = connectedProviders.includes("github");

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "projects":
        return renderProjects();
      case "repositories":
        return renderRepositories();
      case "accounts":
        return renderAccounts();
      case "webhooks":
        return renderWebhooks();
      default:
        return null;
    }
  };

  const renderProjects = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-zinc-400" />
              Your Projects
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              Deploy your projects to GitHub or view existing repositories
            </CardDescription>
          </div>
          <div className="text-sm text-zinc-500">
            {projects.filter(p => p.githubRepository).length}/{projects.length} deployed
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderGit2 className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-white font-medium">No projects found</p>
            <p className="text-sm text-zinc-400 mt-1">
              Generate a project first to deploy it to GitHub
            </p>
            <Button
              onClick={() => router.push("/user/generator")}
              variant="outline"
              className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const isDeployed = project.githubRepository !== null;
              const isDeploying = deploying === project.id;

              return (
                <div
                  key={project.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-all gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium truncate">
                        {project.name}
                      </span>
                      <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px]">
                        {project.platform} · {project.loader}
                      </Badge>
                      {isDeployed ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Deployed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Deployed
                        </Badge>
                      )}
                    </div>
                    {isDeployed && project.githubRepository && (
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <a
                          href={project.githubRepository.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                        >
                          {project.githubRepository.repositoryUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {isDeployed ? (
                      <>
                        {getStatusBadge(project.githubRepository?.lastSyncedAt || null)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(project.githubRepository?.repositoryUrl, "_blank")}
                          className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleDeploy(project)}
                        disabled={isDeploying || !isGitHubConnected}
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Deploy to GitHub
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderRepositories = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-zinc-400" />
              Connected Repositories
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              Click on a repository to view its files, commits, and branches
            </CardDescription>
          </div>
          <div className="text-sm text-zinc-500">
            {repositories.length} connected
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-white font-medium">No repositories connected</p>
            <p className="text-sm text-zinc-400 mt-1">
              Generate a project and deploy it to GitHub
            </p>
            <Button
              onClick={() => router.push("/user/generator")}
              variant="outline"
              className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-all gap-3 cursor-pointer group"
                onClick={() => router.push(`/user/github/repositories/${repo.id}`)}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium truncate">
                      {repo.repositoryName}
                    </span>
                    {repo.private ? (
                      <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px]">
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">
                        Public
                      </Badge>
                    )}
                    {repo.project && (
                      <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                        {repo.project.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <a
                      href={repo.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {repo.repositoryUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px]">
                    <Code2 className="h-3 w-3 mr-1" />
                    {repo.defaultBranch || "main"}
                  </Badge>
                  {getStatusBadge(repo.lastSyncedAt)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/user/github/repositories/${repo.id}`);
                    }}
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(repo.id);
                    }}
                    disabled={syncing === repo.id}
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === repo.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnectClick(repo.id);
                    }}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAccounts = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Link className="h-5 w-5 text-zinc-400" />
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Manage your connected GitHub accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isGitHubConnected ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GithubIcon className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-white font-medium">GitHub not connected</p>
            <p className="text-sm text-zinc-400 mt-1">
              Connect your GitHub account to enable integrations
            </p>
            <Button
              onClick={() => router.push("/api/auth/signin/github")}
              className="mt-4 bg-white text-black hover:bg-zinc-200"
            >
              <GithubIcon className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <GithubIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {session?.user?.name || "GitHub User"}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {session?.user?.email || "No email"}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            {accounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Other Connected Accounts
                </p>
                {accounts.map((account) => (
                  <div
                    key={account.provider}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/20"
                  >
                    <span className="text-sm text-zinc-300 capitalize">
                      {account.provider}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Connected{" "}
                      {formatDistanceToNow(new Date(account.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWebhooks = () => (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-zinc-400" />
          Webhook Status
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Webhooks configured for your repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebhookStatus />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* Alert Dialog untuk Disconnect */}
        <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Disconnect Repository
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to disconnect this repository? This action cannot be undone.
                <br />
                <br />
                The repository will remain on GitHub, but it will no longer be connected to your project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setShowDisconnectDialog(false)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* GitHub Success Dialog */}
        {gitHubData && (
          <GitHubSuccessDialog
            open={showSuccessDialog}
            onOpenChange={setShowSuccessDialog}
            repoUrl={gitHubData.repoUrl}
            cloneUrl={gitHubData.cloneUrl}
            gitCommands={gitHubData.gitCommands}
            projectName={selectedProject?.name || "Project"}
            projectId={selectedProject?.slug || "project"}
            onDownload={() => {
              if (gitHubData.downloadUrl) {
                window.open(gitHubData.downloadUrl, "_blank");
                toast.success("Download started!");
              }
            }}
            isDownloading={false}
          />
        )}

        {/* Deploy Dialog */}
        <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Rocket className="h-5 w-5 text-zinc-400" />
                Deploy to GitHub
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Create a new GitHub repository for "{selectedProject?.name}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-medium">Repository Name</label>
                <input
                  type="text"
                  value={deployRepoName}
                  onChange={(e) => setDeployRepoName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-colors"
                  placeholder="my-awesome-mod"
                />
                <p className="text-xs text-zinc-500">
                  github.com/yourusername/{deployRepoName}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={deployPrivate}
                  onChange={(e) => setDeployPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-zinc-500"
                />
                <label className="text-sm text-zinc-300">
                  Private repository
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeployDialog(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeploy}
                disabled={!deployRepoName || deploying === selectedProject?.id}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {deploying === selectedProject?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Repository
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <GithubIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  GitHub Integration
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Manage repositories, deployments, and webhooks
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/user/generator")}
              className="bg-white text-black hover:bg-zinc-200 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-800 mb-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "projects"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <FolderGit2 className="h-4 w-4" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab("repositories")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "repositories"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <GitBranch className="h-4 w-4" />
              Repositories
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "accounts"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <Link className="h-4 w-4" />
              Accounts
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "webhooks"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <GitPullRequest className="h-4 w-4" />
              Webhooks
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

// Webhook Status Component
function WebhookStatus() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/github/webhooks");
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitPullRequest className="h-12 w-12 text-zinc-600 mb-4" />
        <p className="text-white font-medium">No webhooks configured</p>
        <p className="text-sm text-zinc-400 mt-1">
          Webhooks will be created when you deploy a repository
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 gap-3"
        >
          <div>
            <p className="text-white font-medium text-sm">
              {webhook.repositoryName}
            </p>
            <p className="text-xs text-zinc-500 truncate max-w-[300px]">
              {webhook.repositoryUrl}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
            {webhook.lastSyncedAt && (
              <span className="text-xs text-zinc-500">
                Synced{" "}
                {formatDistanceToNow(new Date(webhook.lastSyncedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}