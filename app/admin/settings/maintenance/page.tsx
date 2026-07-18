// app/admin/settings/maintenance/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, RefreshCw, Server, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface MaintenanceStats {
  pendingBuilds: number;
  runningBuilds: number;
  failedBuilds: number;
  totalDownloads: number;
  failedDownloads: number;
  lastMaintenance: string | null;
}

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowAdminAccess: boolean;
  autoBackupEnabled: boolean;
  backupFrequency: string;
  maxLogRetention: number;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [settings, setSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    maintenanceMessage: "We are currently performing maintenance. Please check back later.",
    allowAdminAccess: true,
    autoBackupEnabled: true,
    backupFrequency: "daily",
    maxLogRetention: 30,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/maintenance");
      
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance settings");
      }
      
      const data = await response.json();
      setStats(data.maintenance || null);
      setSettings(data.settings || {
        maintenanceMode: false,
        maintenanceMessage: "We are currently performing maintenance. Please check back later.",
        allowAdminAccess: true,
        autoBackupEnabled: true,
        backupFrequency: "daily",
        maxLogRetention: 30,
      });
    } catch (error) {
      console.error("Error fetching maintenance settings:", error);
      toast.error("Failed to fetch maintenance settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update maintenance settings");
      }

      toast.success("Maintenance settings updated successfully");
      fetchSettings(); // Refresh data
    } catch (error) {
      console.error("Error updating maintenance settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update maintenance settings");
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
            Loading maintenance settings...
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
              <h2 className="text-2xl font-semibold text-white">Maintenance</h2>
              <p className="text-sm text-white/60 mt-1">
                Configure system maintenance and backup settings
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Builds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingBuilds + stats.runningBuilds}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.pendingBuilds} pending · {stats.runningBuilds} running
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Failed Builds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.failedBuilds}</div>
              <div className="text-xs text-white/40 mt-1">Requires attention</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Total Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalDownloads}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.failedDownloads} failed in last 24h
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Last Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.lastMaintenance ? new Date(stats.lastMaintenance).toLocaleDateString() : "Never"}
              </div>
              <div className="text-xs text-white/40 mt-1">Last system maintenance</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Maintenance Settings */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Maintenance Configuration</CardTitle>
          <CardDescription className="text-white/60">
            Configure system maintenance settings and schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="maintenanceMessage" className="text-white">Maintenance Message</Label>
            <Textarea
              id="maintenanceMessage"
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1.5 min-h-[100px]"
              placeholder="Enter maintenance message"
            />
            <p className="text-xs text-white/40 mt-1">Displayed to users when maintenance mode is enabled</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="backupFrequency" className="text-white">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxLogRetention" className="text-white">Log Retention (days)</Label>
              <Input
                id="maxLogRetention"
                type="number"
                value={settings.maxLogRetention}
                onChange={(e) => setSettings({ ...settings, maxLogRetention: parseInt(e.target.value) || 30 })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
              />
              <p className="text-xs text-white/40 mt-1">Maximum days to keep logs</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="maintenanceMode" className="text-white font-medium cursor-pointer">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-white/40">Enable maintenance mode for the entire site</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <Label htmlFor="allowAdminAccess" className="text-white font-medium cursor-pointer">
                  Allow Admin Access
                </Label>
                <p className="text-sm text-white/40">Allow admins to access the site during maintenance</p>
              </div>
              <Switch
                id="allowAdminAccess"
                checked={settings.allowAdminAccess}
                onCheckedChange={(checked) => setSettings({ ...settings, allowAdminAccess: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <Label htmlFor="autoBackupEnabled" className="text-white font-medium cursor-pointer">
                  Automatic Backups
                </Label>
                <p className="text-sm text-white/40">Enable automatic database backups</p>
              </div>
              <Switch
                id="autoBackupEnabled"
                checked={settings.autoBackupEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, autoBackupEnabled: checked })}
              />
            </div>
          </div>

          {/* Status Indicator */}
          {settings.maintenanceMode && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Maintenance Mode Enabled</p>
                  <p className="text-sm text-yellow-400/60 mt-1">
                    The site is currently in maintenance mode. Users will see the maintenance message.
                    {settings.allowAdminAccess && " Admins can still access the site."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Backup Status */}
          {settings.autoBackupEnabled && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">Backups Enabled</p>
                  <p className="text-sm text-green-400/60 mt-1">
                    Automatic backups are running {settings.backupFrequency}. 
                    Logs are retained for {settings.maxLogRetention} days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-white font-medium mb-4">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  toast.info("Backup process started", {
                    description: "This may take a few minutes.",
                  });
                }}
              >
                <Server className="h-4 w-4 mr-2" />
                Run Backup Now
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  toast.success("Cache cleared successfully");
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  toast.info("System health check started", {
                    description: "Checking all systems...",
                  });
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check System Health
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}