"use client";

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon, FolderIcon, ShareIcon, Trash2Icon } from "lucide-react";

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: React.ReactNode;
  }[];
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="px-2 font-mono text-[11px] font-medium uppercase tracking-widest text-white/35">
        Documents
      </SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const active = isActive(item.url);

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                render={<a href={item.url} />}
                className={cn(
                  "group relative rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                  active
                    ? "bg-white/[0.08] font-medium text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-orange-400" />
                )}
                <span
                  className={cn(
                    "flex shrink-0 items-center [&>svg]:size-4",
                    active ? "text-orange-400" : "text-white/35 group-hover:text-white/70"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="text-white/40 hover:bg-white/[0.08] hover:text-white aria-expanded:bg-white/[0.08] aria-expanded:text-white"
                    />
                  }
                >
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">More</span>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-32 border border-white/10 bg-[#0a0a0b] text-white shadow-2xl shadow-black/60"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem className="gap-2 text-[#d4d4d4] focus:bg-white/[0.08] focus:text-white">
                    <FolderIcon className="size-4" />
                    <span>Open</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-[#d4d4d4] focus:bg-white/[0.08] focus:text-white">
                    <ShareIcon className="size-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2 focus:bg-red-500/10 focus:text-red-400"
                  >
                    <Trash2Icon className="size-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}

        <SidebarMenuItem>
          <SidebarMenuButton className="gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-white/40 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white/70">
            <MoreHorizontalIcon className="size-4" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}