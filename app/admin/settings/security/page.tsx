// app/admin/settings/security/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, RefreshCw, Shield, Key, Users, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SecurityStats {
  totalApiKeys: number;
  activeApiKeys: number;
  revokedApiKeys: number;
  totalUsers: number;
  adminUsers: number;
  recentActivity: number;
  lastPasswordChange: string | null;
}

interface SecuritySettings {
  requireStrongPasswords: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  allowSocialLogin: boolean;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [settings, setSettings] = useState<SecuritySettings>({
    requireStrongPasswords: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    allowSocialLogin: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/security");
      const data = await response.json();
      setStats(data.security);
      setSettings(data.settings);
    } catch (error) {
      console.error("Error fetching security settings:", error);
      toast.error("Failed to fetch security settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to update security settings");

      toast.success("Security settings updated successfully");
    } catch (error) {
      console.error("Error updating security settings:", error);
      toast.error("Failed to update security settings");
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
            Loading security settings...
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
              <h2 className="text-2xl font-semibold text-white">Security Settings</h2>
              <p className="text-sm text-white/60 mt-1">
                Configure system security and authentication settings
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
              <CardTitle className="text-white text-sm font-medium">API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalApiKeys}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.activeApiKeys} active · {stats.revokedApiKeys} revoked
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-xs text-white/40 mt-1">
                {stats.adminUsers} admins
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.recentActivity}</div>
              <div className="text-xs text-white/40 mt-1">Actions in last 7 days</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm font-medium">Security Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">Secure</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Settings Form */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Security Configuration</CardTitle>
          <CardDescription className="text-white/60">
            Update security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="sessionTimeout" className="text-white">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
              />
              <p className="text-xs text-white/40 mt-1">Auto-logout after inactivity</p>
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts" className="text-white">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white mt-1.5"
              />
              <p className="text-xs text-white/40 mt-1">Number of failed attempts before lockout</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="requireStrongPasswords" className="text-white font-medium cursor-pointer">
                  Require Strong Passwords
                </Label>
                <p className="text-sm text-white/40">Enforce complex password requirements</p>
              </div>
              <Switch
                id="requireStrongPasswords"
                checked={settings.requireStrongPasswords}
                onCheckedChange={(checked) => setSettings({ ...settings, requireStrongPasswords: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <Label htmlFor="twoFactorAuth" className="text-white font-medium cursor-pointer">
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-white/40">Require 2FA for admin accounts</p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <div>
                <Label htmlFor="allowSocialLogin" className="text-white font-medium cursor-pointer">
                  Social Login
                </Label>
                <p className="text-sm text-white/40">Allow login with Google and GitHub</p>
              </div>
              <Switch
                id="allowSocialLogin"
                checked={settings.allowSocialLogin}
                onCheckedChange={(checked) => setSettings({ ...settings, allowSocialLogin: checked })}
              />
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">Security Recommendations</p>
                <ul className="text-sm text-blue-400/60 mt-2 space-y-1 list-disc pl-4">
                  <li>Enable two-factor authentication for all admin accounts</li>
                  <li>Regularly review and revoke unused API keys</li>
                  <li>Monitor failed login attempts and suspicious activity</li>
                  <li>Keep all dependencies and packages up to date</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}