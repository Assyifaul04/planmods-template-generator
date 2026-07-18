// app/admin/api-keys/statistics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Key, Ban, CheckCircle, Clock, User, TrendingUp, RefreshCw, Badge } from "lucide-react";
import { toast } from "sonner";

interface UsageStats {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  keysByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
  keysUsedLast7Days: number;
  keysUsedLast30Days: number;
  expiredKeys: number;
}

export default function ApiUsageStatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/api-keys/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching API key statistics:", error);
      toast.error("Failed to fetch API key statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            Loading statistics...
          </div>
        </div>
      </div>
    );
  }

  const safeStats = stats || {
    totalKeys: 0,
    activeKeys: 0,
    revokedKeys: 0,
    keysByUser: [],
    keysUsedLast7Days: 0,
    keysUsedLast30Days: 0,
    expiredKeys: 0,
  };

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/api-keys")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-white">API Key Usage Statistics</h2>
              <p className="text-sm text-white/60 mt-1">
                Analytics and metrics for API key usage
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchStats}
          className="border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{safeStats.totalKeys}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{safeStats.activeKeys}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Revoked Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{safeStats.revokedKeys}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Expired Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{safeStats.expiredKeys}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {safeStats.keysByUser.length}
            </div>
            <div className="text-xs text-white/40 mt-1">Users with API keys</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Used Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {safeStats.keysUsedLast7Days}
            </div>
            <div className="text-xs text-white/40 mt-1">Active keys used recently</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Used Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {safeStats.keysUsedLast30Days}
            </div>
            <div className="text-xs text-white/40 mt-1">Active keys used</div>
          </CardContent>
        </Card>
      </div>

      {/* Keys by User */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Keys by User</CardTitle>
          <CardDescription className="text-white/60">
            Distribution of API keys per user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">User</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60 text-right">API Keys</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeStats.keysByUser.length > 0 ? (
                safeStats.keysByUser.map((item) => (
                  <TableRow key={item.userId} className="border-white/10">
                    <TableCell className="text-white">{item.userName}</TableCell>
                    <TableCell className="text-white/60">{item.userEmail}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {item.count} keys
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-white/40 py-4">
                    No API key data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-black/40 border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Summary</CardTitle>
          <CardDescription className="text-white/60">
            Key statistics overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-white/40">Active Rate</div>
                <div className="text-xl font-bold text-white">
                  {safeStats.totalKeys > 0
                    ? ((safeStats.activeKeys / safeStats.totalKeys) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-white/30">
                  {safeStats.activeKeys} of {safeStats.totalKeys} keys active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-white/40">Revoked Rate</div>
                <div className="text-xl font-bold text-white">
                  {safeStats.totalKeys > 0
                    ? ((safeStats.revokedKeys / safeStats.totalKeys) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-white/30">
                  {safeStats.revokedKeys} keys revoked
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}