// components/docs/docs-dropdown.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  BookOpen,
  Rocket,
  Blocks,
  Code2,
  FileArchive,
  Settings,
  Box,
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const docsGroups = [
  {
    label: "Start here",
    items: [
      {
        title: "Getting Started",
        description: "Set up your first PlanMod project",
        href: "/docs",
        icon: Rocket,
      },
      {
        title: "Installation",
        description: "Install the CLI and dependencies",
        href: "/docs/installation",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Mod loaders",
    items: [
      {
        title: "Fabric",
        description: "Lightweight, modular loader",
        href: "/docs/fabric",
        icon: Blocks,
      },
      {
        title: "Forge",
        description: "The original modding platform",
        href: "/docs/forge",
        icon: Blocks,
      },
      {
        title: "NeoForge",
        description: "Community-driven Forge fork",
        href: "/docs/neoforge",
        icon: Blocks,
      },
      {
        title: "Paper",
        description: "High-performance server software",
        href: "/docs/paper",
        icon: Box,
      },
      {
        title: "Bedrock",
        description: "Add-ons for Bedrock Edition",
        href: "/docs/bedrock",
        icon: Box,
      },
    ],
  },
  {
    label: "Tools & integrations",
    items: [
      {
        title: "GitHub Integration",
        description: "Publish generated projects directly",
        href: "/docs/github",
        icon: GithubIcon,
      },
      {
        title: "ZIP Generator",
        description: "Download a ready-to-build archive",
        href: "/docs/zip",
        icon: FileArchive,
      },
      {
        title: "Open in VS Code",
        description: "Jump straight into your editor",
        href: "/docs/vscode",
        icon: Code2,
      },
      {
        title: "API Reference",
        description: "Automate template generation",
        href: "/docs/api",
        icon: Settings,
      },
    ],
  },
];

export function DocsDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDocsActive = pathname.startsWith("/docs");

  // Close on outside click and on Escape, on top of the existing hover/click toggle
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Docs Button */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
          isDocsActive ? "text-white" : "text-[#a1a1a1] hover:text-white"
        }`}
        onClick={() => setIsOpen((v) => !v)}
      >
        Docs
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {isDocsActive && (
          <span className="absolute inset-x-3 -bottom-[1px] h-px bg-white" />
        )}
      </button>

      {/* Dropdown Menu — solid panel, no see-through backdrop */}
      {isOpen && (
        <div
          role="menu"
          className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-full z-50 mt-2 w-[560px] max-w-[92vw] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0b] shadow-2xl shadow-black/70 duration-200"
        >
          <div className="grid grid-cols-2 gap-x-2 gap-y-5 p-4">
            {docsGroups.map((group) => (
              <div
                key={group.label}
                className={group.items.length > 3 ? "col-span-2" : "col-span-1"}
              >
                <p className="px-2 pb-2 font-mono text-[11px] uppercase tracking-widest text-white/35">
                  {group.label}
                </p>

                <div
                  className={
                    group.items.length > 3
                      ? "grid grid-cols-2 gap-1"
                      : "flex flex-col gap-1"
                  }
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={`group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-150 ${
                          isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${
                            isActive
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/10 bg-white/[0.04] text-[#a1a1a1] group-hover:border-white/20 group-hover:text-white"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>

                        <span className="min-w-0">
                          <span
                            className={`block text-[13px] font-medium ${
                              isActive ? "text-white" : "text-[#e5e5e5] group-hover:text-white"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="block truncate text-[12px] text-[#8a8a8a]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10" />

          <Link
            href="/docs"
            className="flex items-center justify-between bg-white/[0.02] px-5 py-3 text-[13px] font-medium text-[#a1a1a1] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <span>View all documentation</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}