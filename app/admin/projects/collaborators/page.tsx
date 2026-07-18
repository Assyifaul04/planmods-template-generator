// app/admin/projects/collaborators/page.tsx
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

export default function CollaboratorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchCollaborators();
    }
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}/collaborators`);
      const data = await response.json();
      setCollaborators(data);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
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
          <h2 className="text-2xl font-semibold text-white">Project Collaborators</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage collaborators for project {projectId?.slice(0, 8) || ""}
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
            <TableRow className="border-white/10">
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    Loading collaborators...
                  </div>
                </TableCell>
              </TableRow>
            ) : collaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-white/20" />
                    <p>No collaborators found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              collaborators.map((collaborator) => (
                <TableRow key={collaborator.id} className="border-white/10 hover:bg-white/5">
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
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
    </div>
  );
}