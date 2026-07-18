// app/admin/settings/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Shield, Server, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const settingsItems = [
    {
      title: "General Settings",
      description: "Configure basic system settings and preferences",
      icon: Settings2,
      path: "/admin/settings/general",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Security Settings",
      description: "Manage security configurations and authentication",
      icon: Shield,
      path: "/admin/settings/security",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Maintenance",
      description: "Configure system maintenance and backup settings",
      icon: Server,
      path: "/admin/settings/maintenance",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">System Settings</h2>
        <p className="text-sm text-white/60 mt-1">
          Configure and manage system settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="bg-black/40 border-white/10 hover:border-white/20 transition-colors cursor-pointer"
              onClick={() => router.push(item.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <CardTitle className="text-white">{item.title}</CardTitle>
                <CardDescription className="text-white/60">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-white/60 hover:text-white hover:bg-white/10"
                >
                  <span>Configure</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 rounded-lg border border-white/10 bg-black/40">
        <h3 className="text-white font-medium mb-2">Need Help?</h3>
        <p className="text-sm text-white/60">
          If you need assistance with system settings, please refer to the documentation
          or contact support.
        </p>
        <Button
          variant="outline"
          className="mt-4 border-white/10 text-white hover:bg-white/10"
          onClick={() => window.open("/docs/admin/settings", "_blank")}
        >
          View Documentation
        </Button>
      </div>
    </div>
  );
}