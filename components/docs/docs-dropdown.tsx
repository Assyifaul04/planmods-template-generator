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
      { title: "GitHub Integration", href: "/docs/github", icon: GithubIcon },
      { title: "ZIP Generator", href: "/docs/zip", icon: FileArchive },
      { title: "Open in VS Code", href: "/docs/vscode", icon: Code2 },
      { title: "API Reference", href: "/docs/api", icon: Settings },
    ],
  },
];

export function DocsDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDocsActive = pathname.startsWith("/docs");

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  };

  const closeWithDelay = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 120);
  };

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

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeWithDelay}
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

      {/* Full-width panel, menyatu dengan navbar */}
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`fixed inset-x-0 top-16 z-40 origin-top border-b border-white/[0.08] bg-black shadow-[0_24px_48px_-20px_rgba(0,0,0,0.9)] transition-all duration-200 ease-out ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            {docsGroups.map((group) => (
              <div key={group.label} className="min-w-[160px]">
                <p className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-white/40">
                  {group.label}
                </p>

                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={`size-[15px] shrink-0 transition-colors duration-150 ${
                            isActive
                              ? "text-white"
                              : "text-[#767676] group-hover:text-white"
                          }`}
                        />
                        <span
                          className={`whitespace-nowrap text-[13px] font-medium transition-colors duration-150 ${
                            isActive
                              ? "text-white"
                              : "text-[#c9c9c9] group-hover:text-white"
                          }`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <Link
              href="/docs"
              className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[#a1a1a1] transition-colors duration-150 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <span>View all documentation</span>
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
