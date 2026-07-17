"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<a href={item.url} />}
                  className={cn(
                    "group relative rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                    active
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  {active && (
                    <span className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-orange-400" />
                  )}
                  <span
                    className={cn(
                      "flex shrink-0 items-center [&>svg]:size-4",
                      active ? "text-orange-400" : "text-white/30 group-hover:text-white/60"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}