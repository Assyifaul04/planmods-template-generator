// app/admin/settings/general/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalTemplates: number;
  totalBuilds: number;
  activeUsers: number;
  bannedUsers: number;
}

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxProjectsPerUser: number;
  maxFileSize: number;
}

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [settings, setSettings] = useState<GeneralSettings>({
    siteName: "PlanMod",
    siteDescription: "Minecraft Mod Template Generator",
    maintenanceMode: false,
    registrationEnabled: true,
    maxProjectsPerUser: 50,
    maxFileSize: 100,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      setStats(data.stats);
      setSettings(data.settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/settings")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">General Settings</h2>
              <p className="text-sm text-white/60 mt-1">
                Configure general system settings
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSettings}
            className="border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black hover:bg-white/90"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.activeUsers} active · {stats.bannedUsers} banned
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Projects & Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.totalTemplates} templates available
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Build History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalBuilds}</div>
              <div className="text-xs text-white/40 mt-1">Total builds processed</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Form */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">System Configuration</CardTitle>
          <CardDescription className="text-white/60">
            Update general system settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="siteName" className="text-white">Site Name *</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="maxProjectsPerUser" className="text-white">Max Projects per User</Label>
              <Input
                id="maxProjectsPerUser"
                type="number"
                value={settings.maxProjectsPerUser}
                onChange={(e) => setSettings({ ...settings, maxProjectsPerUser: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
              />
              <p className="text-xs text-white/40 mt-1">Set to 0 for unlimited</p>
            </div>
          </div>

          <div>
            <Label htmlFor="siteDescription" className="text-white">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1.5 min-h-[100px]"
              placeholder="Enter site description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="maxFileSize" className="text-white">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
              />
              <p className="text-xs text-white/40 mt-1">Maximum file size for uploads</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="registrationEnabled" className="text-white font-medium cursor-pointer">
                  User Registration
                </Label>
                <p className="text-sm text-white/40">Allow new users to register</p>
              </div>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <Label htmlFor="maintenanceMode" className="text-white font-medium cursor-pointer">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-white/40">Put the site in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </div>

          {settings.maintenanceMode && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Maintenance Mode Enabled</p>
                  <p className="text-sm text-yellow-400/60 mt-1">
                    The site is currently in maintenance mode. Users will see a maintenance page.
                    You can still access the admin panel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}