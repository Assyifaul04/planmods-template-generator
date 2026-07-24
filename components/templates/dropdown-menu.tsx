// components/templates/dropdown-menu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Layers, Star, Blocks, Box, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const templateCategories = [
  { href: "/templates/fabric", label: "Fabric", icon: Blocks },
  { href: "/templates/forge", label: "Forge", icon: Blocks },
  { href: "/templates/neoforge", label: "NeoForge", icon: Blocks },
  { href: "/templates/paper", label: "Paper", icon: Box },
  { href: "/templates/bedrock", label: "Bedrock", icon: Box },
];

export function TemplatesDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTemplatesActive = pathname.startsWith("/templates");

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
      {/* Templates Button — posisi tetap, tidak berubah */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
          isTemplatesActive ? "text-white" : "text-[#a1a1a1] hover:text-white"
        }`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Layers className="h-4 w-4" />
        Templates
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {isTemplatesActive && (
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
            {/* Overview */}
            <div className="min-w-[160px]">
              <p className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-white/40">
                Overview
              </p>

              <div className="flex flex-col gap-0.5">
                <Link
                  href="/templates"
                  role="menuitem"
                  className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
                  onClick={() => setIsOpen(false)}
                >
                  <Layers
                    className={`size-[15px] shrink-0 transition-colors duration-150 ${
                      pathname === "/templates"
                        ? "text-white"
                        : "text-[#767676] group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap text-[13px] font-medium transition-colors duration-150 ${
                      pathname === "/templates"
                        ? "text-white"
                        : "text-[#c9c9c9] group-hover:text-white"
                    }`}
                  >
                    Browse All
                  </span>
                </Link>

                <Link
                  href="/templates/favorites"
                  role="menuitem"
                  className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
                  onClick={() => setIsOpen(false)}
                >
                  <Star
                    className={`size-[15px] shrink-0 transition-colors duration-150 ${
                      pathname === "/templates/favorites"
                        ? "text-white"
                        : "text-[#767676] group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap text-[13px] font-medium transition-colors duration-150 ${
                      pathname === "/templates/favorites"
                        ? "text-white"
                        : "text-[#c9c9c9] group-hover:text-white"
                    }`}
                  >
                    Favorites
                  </span>
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="min-w-[160px]">
              <p className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-white/40">
                Categories
              </p>

              <div className="flex flex-col gap-0.5">
                {templateCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive =
                    pathname === category.href ||
                    pathname.startsWith(category.href + "/");

                  return (
                    <Link
                      key={category.href}
                      href={category.href}
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
                        {category.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <Link
              href="/templates"
              className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[#a1a1a1] transition-colors duration-150 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <span>View all templates</span>
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}