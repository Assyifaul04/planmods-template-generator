"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  Rocket,
  Blocks,
  Code2,
  FileArchive,
  Settings,
  Box,
} from "lucide-react";

import { cn } from "@/lib/utils";

const menuGroups = [
  {
    label: "Start here",
    items: [
      { title: "Getting Started", href: "/docs", icon: Rocket },
      { title: "Installation", href: "/docs/installation", icon: BookOpen },
    ],
  },
  {
    label: "Mod loaders",
    items: [
      { title: "Fabric", href: "/docs/fabric", icon: Blocks },
      { title: "Forge", href: "/docs/forge", icon: Blocks },
      { title: "NeoForge", href: "/docs/neoforge", icon: Blocks },
      { title: "Paper", href: "/docs/paper", icon: Box },
      { title: "Bedrock", href: "/docs/bedrock", icon: Box },
    ],
  },
  {
    label: "Tools & integrations",
    items: [
      { title: "GitHub Integration", href: "/docs/github", icon: Code2 },
      { title: "ZIP Generator", href: "/docs/zip", icon: FileArchive },
      { title: "Open in VS Code", href: "/docs/vscode", icon: Code2 },
      { title: "API Reference", href: "/docs/api", icon: Settings },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-black px-4 py-8 lg:block">
      <div className="mb-8 px-2">
        <h2 className="text-sm font-semibold text-white">Documentation</h2>
        <p className="mt-1 text-xs text-white/40">
          PlanMod Template Generator
        </p>
      </div>

      <nav className="space-y-6">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 font-mono text-[11px] font-medium uppercase tracking-widest text-white/35">
              {group.label}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                      active
                        ? "bg-white/[0.08] font-medium text-white"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute -left-4 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                    )}
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0 transition-colors duration-150",
                        active
                          ? "text-white"
                          : "text-white/35 group-hover:text-white/70"
                      )}
                    />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}