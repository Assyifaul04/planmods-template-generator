// app/admin/projects/collaborators/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  projectId: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  invitedBy: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
}

// ✅ Component dengan useSearchParams dibungkus Suspense
function CollaboratorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchCollaborators();
    } else {
      setLoading(false);
      setError("No project ID provided");
    }
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/projects/${projectId}/collaborators`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCollaborators(data.collaborators || []);
      setProjectName(data.projectName || "");
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch collaborators");
      toast.error("Failed to fetch collaborators");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      OWNER: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      EDITOR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      VIEWER: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return <Badge className={colors[role] || colors.VIEWER}>{role}</Badge>;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredCollaborators = collaborators.filter((c) =>
    c.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user.email.toLowerCase().includes(search.toLowerCase()) ||
    c.user.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="h-12 w-12 text-white/20" />
        <p className="text-white/40">No project selected</p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/projects")}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

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
          <h2 className="text-2xl font-semibold text-white">
            Project Collaborators
            {projectName && (
              <span className="text-sm font-normal text-white/40 ml-2">
                {projectName}
              </span>
            )}
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Manage collaborators for project ID: {projectId.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search collaborators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          variant="outline"
          className="border-white/10 text-white hover:bg-white/10"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Collaborator
        </Button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">User</TableHead>
              <TableHead className="text-white/60">Email</TableHead>
              <TableHead className="text-white/60">Role</TableHead>
              <TableHead className="text-white/60">Added</TableHead>
              <TableHead className="text-white/60 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    Loading collaborators...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-red-400">⚠️ {error}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchCollaborators}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCollaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-white/20" />
                    <p>
                      {search ? "No collaborators match your search" : "No collaborators found"}
                    </p>
                    {!search && (
                      <p className="text-xs text-white/20">
                        Add collaborators to this project
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCollaborators.map((collaborator) => (
                <TableRow key={collaborator.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.user.image || undefined} />
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {getInitials(collaborator.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white font-medium">
                          {collaborator.user.name || "Unknown"}
                        </div>
                        {collaborator.user.username && (
                          <div className="text-xs text-white/30">@{collaborator.user.username}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">{collaborator.user.email}</TableCell>
                  <TableCell>{getRoleBadge(collaborator.role)}</TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(collaborator.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {collaborators.length > 0 && (
        <div className="mt-4 text-xs text-white/20">
          Total: {collaborators.length} collaborator{collaborators.length > 1 ? "s" : ""}
          {search && filteredCollaborators.length !== collaborators.length && (
            <span> · Showing {filteredCollaborators.length}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CollaboratorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    }>
      <CollaboratorsContent />
    </Suspense>
  );
}