// app/admin/users/plans/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Crown, Users, Zap } from "lucide-react";
import { toast } from "sonner";

interface PlanData {
  plan: string;
  count: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    _count: {
      projects: number;
      downloads: number;
    };
  }>;
}

export default function PlansPage() {
  const router = useRouter();
  const [planData, setPlanData] = useState<PlanData[]>([]);
  const [stats, setStats] = useState({ freeCount: 0, proCount: 0, teamCount: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlansData();
  }, []);

  const fetchPlansData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users/plans");
      const data = await response.json();
      setPlanData(data.planUsers || []);
      setStats({
        freeCount: data.freeCount || 0,
        proCount: data.proCount || 0,
        teamCount: data.teamCount || 0,
        totalUsers: data.totalUsers || 0,
      });
    } catch (error) {
      console.error("Error fetching plans data:", error);
      toast.error("Failed to fetch plans data");
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "FREE":
        return <Zap className="h-4 w-4" />;
      case "PRO":
        return <Star className="h-4 w-4" />;
      case "TEAM":
        return <Users className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "border-gray-500/30 text-gray-400";
      case "PRO":
        return "border-blue-500/30 text-blue-400";
      case "TEAM":
        return "border-orange-500/30 text-orange-400";
      default:
        return "border-white/10 text-white/40";
    }
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
          onClick={() => router.push("/admin/users")}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-white">User Plans</h2>
          <p className="text-sm text-white/60 mt-1">
            Manage user subscription plans and view plan distribution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Free</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{stats.freeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.proCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.teamCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {planData.map((plan) => (
          <Card key={plan.plan} className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                {getPlanIcon(plan.plan)}
                <CardTitle className="text-white">{plan.plan}</CardTitle>
                <Badge className={`ml-auto ${getPlanColor(plan.plan)}`}>
                  {plan.count} users
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                Users on the {plan.plan} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/60">User</TableHead>
                    <TableHead className="text-white/60 text-right">Projects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-white/40">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : plan.recentUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-white/40">
                        No users on this plan
                      </TableCell>
                    </TableRow>
                  ) : (
                    plan.recentUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/10">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-white/10 text-white text-[10px]">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-white text-sm">{user.name || "Unknown"}</div>
                              <div className="text-xs text-white/40">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/60 text-right">
                          {user._count.projects}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}