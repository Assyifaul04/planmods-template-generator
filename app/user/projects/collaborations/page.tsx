// app/user/projects/collaborations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Eye,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderIcon,
  Globe,
  Lock,
  User,
  Calendar,
  GitBranch,
  Loader2,
  Star,
  Download,
  Shield,
  EyeIcon,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Collaboration {
  id: string;
  role: "EDITOR" | "VIEWER";
  createdAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    platform: "JAVA" | "BEDROCK";
    loader: string;
    minecraftVersion: string;
    status: "DRAFT" | "GENERATING" | "READY" | "FAILED" | "ARCHIVED";
    visibility: "PRIVATE" | "UNLISTED" | "PUBLIC";
    starsCount: number;
    downloadsCount: number;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    template: {
      id: string;
      name: string;
    } | null;
    _count: {
      downloads: number;
      stars: number;
      builds: number;
      collaborators: number;
    };
  };
}

export default function CollaborationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCollaborations();
  }, [search, page]);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });

      const response = await fetch(`/api/user/projects/collaborations?${params}`);
      const data = await response.json();
      setCollaborations(data.collaborations || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      toast.error("Failed to fetch collaborations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
      GENERATING: { label: "Generating", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      READY: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      FAILED: { label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      ARCHIVED: { label: "Archived", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    };
    const statusInfo = statusMap[status] || statusMap.DRAFT;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
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
      <Badge variant="outline" className="text-white/60 border-white/20">
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string; icon: any }> = {
      EDITOR: { label: "Editor", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Shield },
      VIEWER: { label: "Viewer", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: EyeIcon },
    };
    const info = roleMap[role] || roleMap.VIEWER;
    const Icon = info.icon;
    return (
      <Badge className={`${info.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

  // ✅ Fungsi untuk mendapatkan inisial dari nama
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Collaborations
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Projects you've been invited to collaborate on
          </p>
        </div>
        <Button
          onClick={() => router.push("/user/generator")}
          className="bg-white text-black hover:bg-white/90"
        >
          <Users className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search collaborations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Button
          variant="outline"
          onClick={fetchCollaborations}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Collaborations Table */}
      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">Project</TableHead>
              <TableHead className="text-white/60 font-medium">Owner</TableHead>
              <TableHead className="text-white/60 font-medium">Platform</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium">Visibility</TableHead>
              <TableHead className="text-white/60 font-medium">Role</TableHead>
              <TableHead className="text-white/60 font-medium">Joined</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading collaborations...
                  </div>
                </TableCell>
              </TableRow>
            ) : collaborations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-white/20" />
                    <p>No collaborations found</p>
                    <p className="text-xs text-white/30">
                      You haven't been invited to any projects yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/user/generator")}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Create your own project
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              collaborations.map((collab) => (
                <TableRow key={collab.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <div className="text-white font-medium">{collab.project.name}</div>
                      <div className="text-xs text-white/40">{collab.project.slug}</div>
                      {collab.project.template && (
                        <div className="text-xs text-white/30">
                          Template: {collab.project.template.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* ✅ Avatar dengan gambar */}
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={collab.project.user.image || undefined} 
                          alt={collab.project.user.name || "User"} 
                        />
                        <AvatarFallback className="bg-white/10 text-white/60 text-xs">
                          {getInitials(collab.project.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white/80">
                        {collab.project.user.name || "Unknown User"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      {collab.project.platform}
                    </Badge>
                    <div className="text-xs text-white/30 mt-1">{collab.project.loader}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(collab.project.status)}</TableCell>
                  <TableCell>{getVisibilityBadge(collab.project.visibility)}</TableCell>
                  <TableCell>{getRoleBadge(collab.role)}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {formatDistanceToNow(new Date(collab.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black border-white/10 text-white">
                        <DropdownMenuItem
                          onClick={() => router.push(`/user/projects/${collab.project.id}`)}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {collab.role === "EDITOR" && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/user/projects/${collab.project.id}/edit`)}
                            className="hover:bg-white/10 cursor-pointer"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/40">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}