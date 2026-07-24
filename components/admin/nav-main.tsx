// components/admin/nav-main.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 font-mono text-[11px] font-medium uppercase tracking-widest text-white/35">
        Menu
      </SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const isOpen = openItems[item.title] ?? isActive(item.url);
          const active = isActive(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              {hasSubItems ? (
                <>
                  <SidebarMenuButton
                    onClick={() => toggleItem(item.title)}
                    aria-expanded={isOpen}
                    className={cn(
                      "group relative flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                      active
                        ? "bg-white/[0.08] font-medium text-white"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-orange-400" />
                    )}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "shrink-0 transition-colors duration-150",
                          active
                            ? "text-orange-400"
                            : "text-white/35 group-hover:text-white/70"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-white/35 transition-transform duration-200",
                        isOpen && "rotate-180 text-white/70"
                      )}
                    />
                  </SidebarMenuButton>

                  <div
                    className="grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="min-h-0">
                      <SidebarMenuSub className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                        {item.items?.map((subItem) => {
                          const subActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {/* ✅ Hapus asChild dan gunakan komponen langsung */}
                              <SidebarMenuSubButton
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                                  subActive
                                    ? "bg-white/[0.08] font-medium text-white"
                                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                                )}
                              >
                                <Link href={subItem.url} className="flex w-full items-center">
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </div>
                  </div>
                </>
              ) : (
                // ✅ Hapus asChild dan gunakan Link langsung di dalam
                <SidebarMenuButton
                  className={cn(
                    "group relative rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                    active
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <Link href={item.url} className="flex w-full items-center gap-2.5">
                    {active && (
                      <span className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-orange-400" />
                    )}
                    <span
                      className={cn(
                        "shrink-0 transition-colors duration-150",
                        active
                          ? "text-orange-400"
                          : "text-white/35 group-hover:text-white/70"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}