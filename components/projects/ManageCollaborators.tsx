// components/projects/ManageCollaborators.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Mail,
  Crown,
  Shield,
  Eye,
  CheckCircle,
  AlertCircle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  isOwner?: boolean;
}

interface ManageCollaboratorsProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export function ManageCollaborators({
  projectId,
  projectName,
  isOwner,
  isAdmin,
  onUpdate,
}: ManageCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    role: "VIEWER" as "EDITOR" | "VIEWER",
  });

  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (projectId) {
      fetchCollaborators();
    }
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/projects/${projectId}/collaborators`);
      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      toast.error("Failed to fetch collaborators");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!formData.email) {
      toast.error("Please enter an email address");
      return;
    }

    setAdding(true);
    setInviteSuccess(null);
    try {
      const response = await fetch(`/api/user/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add collaborator");
      }

      const data = await response.json();
      setInviteSuccess(formData.email);
      
      // ✅ Alert notifikasi berhasil dikirim
      toast.success(
        `✨ Invitation sent to ${formData.email} as ${formData.role}!`,
        {
          description: `The user will receive a notification to collaborate on "${projectName}".`,
          duration: 5000,
          icon: <Bell className="h-5 w-5 text-green-400" />,
        }
      );
      
      setFormData({ email: "", role: "VIEWER" });
      
      setTimeout(() => {
        setShowAddDialog(false);
        setInviteSuccess(null);
      }, 1500);
      
      fetchCollaborators();
      onUpdate?.();
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add collaborator");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove "${userName}" from this project?`)) {
      return;
    }

    setRemoving(collaboratorId);
    setRemoveSuccess(null);
    try {
      const response = await fetch(
        `/api/user/projects/${projectId}/collaborators?collaboratorId=${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove collaborator");
      }

      setRemoveSuccess(userName);
      
      // ✅ Alert notifikasi hapus berhasil
      toast.success(
        `🗑️ ${userName} has been removed from "${projectName}"`,
        {
          description: "The user will receive a notification about this change.",
          duration: 5000,
          icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
        }
      );
      
      fetchCollaborators();
      onUpdate?.();
      
      setTimeout(() => {
        setRemoveSuccess(null);
      }, 2000);
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove collaborator");
    } finally {
      setRemoving(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-3.5 w-3.5 text-yellow-400" />;
      case "EDITOR":
        return <Shield className="h-3.5 w-3.5 text-blue-400" />;
      case "VIEWER":
        return <Eye className="h-3.5 w-3.5 text-gray-400" />;
      default:
        return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      OWNER: { label: "Owner", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      EDITOR: { label: "Editor", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      VIEWER: { label: "Viewer", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    };
    const info = roleMap[role] || roleMap.VIEWER;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        <span className="ml-2 text-sm text-white/40">Loading collaborators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-medium text-white">
            Collaborators ({collaborators.length})
          </h3>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-white text-black hover:bg-white/90"
          >
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            Invite
          </Button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              <TableHead className="text-white/60 font-medium">User</TableHead>
              <TableHead className="text-white/60 font-medium">Role</TableHead>
              <TableHead className="text-white/60 font-medium">Joined</TableHead>
              {canManage && (
                <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {collaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="text-center py-6 text-white/40">
                  No collaborators yet
                </TableCell>
              </TableRow>
            ) : (
              collaborators.map((collab) => (
                <TableRow key={collab.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60">
                        {collab.user.name?.[0] || collab.user.email?.[0] || "U"}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">
                          {collab.user.name || "Unknown User"}
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {collab.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(collab.role)}
                      {getRoleBadge(collab.role)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-white/40">
                    {new Date(collab.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {!collab.isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collab.id, collab.user.name || "User")}
                          disabled={removing === collab.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {removing === collab.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Collaborator Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-white/60" />
              Invite Collaborator
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Invite a user to collaborate on <span className="text-white font-medium">{projectName}</span>
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-lg font-medium text-white">Invitation Sent! 🎉</p>
              <p className="text-sm text-white/60 text-center">
                {inviteSuccess} has been added as a collaborator.
                <br />
                <span className="text-xs text-white/40">
                  A notification has been sent to the user.
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white focus-visible:ring-white/20"
                />
                <p className="text-[10px] text-white/30">
                  User must have an account on PlanMod
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white/90">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "EDITOR" | "VIEWER" })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    <SelectItem value="EDITOR">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span>Editor</span>
                        <span className="text-xs text-white/40">- Can edit project</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>Viewer</span>
                        <span className="text-xs text-white/40">- Can view only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            {!inviteSuccess && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCollaborator}
                  disabled={adding}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Collaborator
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}