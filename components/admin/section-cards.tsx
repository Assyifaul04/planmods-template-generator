// components/admin/section-cards.tsx
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  FolderGit,
  Users,
  GitBranch,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalProjects: number;
  totalUsers: number;
  totalRepositories: number;
  totalDownloads: number;
  totalStars: number;
  activeProjects: number;
  newUsersThisMonth: number;
  newProjectsThisMonth: number;
  growthRate: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  description?: string;
  loading?: boolean;
  className?: string;
}

function StatCard({ title, value, icon, trend, subtitle, description, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("animate-pulse border-border/60", className)}>
        <CardHeader>
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded mt-2" />
        </CardHeader>
        <CardFooter>
          <div className="h-4 w-48 bg-muted rounded" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn("group hover:shadow-md transition-all duration-300 border-border/60", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardDescription>
          {trend && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 font-medium border-foreground/20",
                trend.isPositive
                  ? "text-foreground bg-foreground/5"
                  : "text-muted-foreground bg-muted/40"
              )}
            >
              {trend.isPositive ? (
                <TrendingUpIcon className="h-3 w-3" />
              ) : (
                <TrendingDownIcon className="h-3 w-3" />
              )}
              {trend.value > 0 ? `+${trend.value}` : trend.value}%
            </Badge>
          )}
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 pt-0">
        {subtitle && (
          <div className="flex items-center gap-2 text-sm">
            {trend?.isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-foreground" />
            ) : trend && !trend.isPositive ? (
              <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-foreground">{subtitle}</span>
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardFooter>
    </Card>
  );
}

export function SectionCards() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/stats");
        const result = await response.json();

        if (response.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Projects",
      value: data?.totalProjects.toLocaleString() || "0",
      icon: <FolderGit className="h-4 w-4 text-foreground" />,
      trend: {
        value: data?.activeProjects || 0,
        label: "Active",
        isPositive: true,
      },
      subtitle: `${data?.newProjectsThisMonth || 0} new this month`,
      description: `${data?.activeProjects || 0} active projects`,
    },
    {
      title: "Total Users",
      value: data?.totalUsers.toLocaleString() || "0",
      icon: <Users className="h-4 w-4 text-foreground" />,
      trend: {
        value: data?.newUsersThisMonth || 0,
        label: "New",
        isPositive: (data?.newUsersThisMonth || 0) > 0,
      },
      subtitle: `${data?.newUsersThisMonth || 0} new users this month`,
      description: "Total registered users",
    },
    {
      title: "Repositories",
      value: data?.totalRepositories.toLocaleString() || "0",
      icon: <GitBranch className="h-4 w-4 text-foreground" />,
      trend: {
        value: data?.totalStars || 0,
        label: "Stars",
        isPositive: true,
      },
      subtitle: `${data?.totalStars || 0} total stars`,
      description: `${data?.totalRepositories || 0} connected GitHub repos`,
    },
    {
      title: "Total Downloads",
      value: data?.totalDownloads.toLocaleString() || "0",
      icon: <Download className="h-4 w-4 text-foreground" />,
      trend: {
        value: data?.growthRate || 0,
        label: "Growth",
        isPositive: (data?.growthRate || 0) >= 0,
      },
      subtitle:
        data?.growthRate && data.growthRate > 0
          ? `Growing ${data.growthRate}% this period`
          : data?.growthRate && data.growthRate < 0
          ? `Declining ${Math.abs(data.growthRate)}% this period`
          : "Stable growth",
      description: "Total downloads across all projects",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          {...card}
          loading={loading}
          className="bg-card border-border/60"
        />
      ))}
    </div>
  );
}