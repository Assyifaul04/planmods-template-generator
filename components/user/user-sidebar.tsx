// components/user/user-sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboardIcon,
  BellIcon,
  DownloadIcon,
  HistoryIcon,
  FolderIcon,
  PackageIcon,
  HammerIcon,
  UserIcon,
  KeyIcon,
  CreditCardIcon,
  GitBranchIcon,
  StarIcon,
  UsersIcon,
  SettingsIcon,
  ShieldIcon,
  BookOpenIcon,
  HelpCircleIcon,
  ActivityIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  SparklesIcon,
  CloudIcon,
  Code2Icon,
  ServerIcon,
  TerminalIcon,
  ZapIcon,
  Play,
  LayersIcon,
  LinkIcon,
  WebhookIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  requiresPlan?: ("PRO" | "TEAM")[];
  badge?: number;
};

type MenuSection = {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
};

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

// ============================================================================
// MENU SECTIONS
// ============================================================================

const menuSections: MenuSection[] = [
  // 1. DASHBOARD
  {
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    defaultOpen: true,
    items: [
      { title: "Overview", url: "/user/dashboard", icon: LayoutDashboardIcon },
      { title: "Notifications", url: "/user/notifications", icon: BellIcon },
      { title: "Downloads", url: "/user/downloads", icon: DownloadIcon },
      { title: "Activity Log", url: "/user/activity", icon: HistoryIcon },
    ],
  },

  // 2. PROJECTS
  {
    label: "Projects",
    icon: FolderIcon,
    defaultOpen: true,
    items: [
      { title: "Generate", url: "/user/generator", icon: SparklesIcon },
      { title: "My Projects", url: "/user/projects", icon: FolderIcon },
      {
        title: "Collaborations",
        url: "/user/projects/collaborations",
        icon: UsersIcon,
      },
    ],
  },

  // 4. GITHUB
  {
    label: "GitHub",
    icon: GitBranchIcon,
    defaultOpen: false,
    items: [
      {
        title: "Overview",
        url: "/user/github",
        icon: GithubIcon,
      },
    ],
  },

  // 6. ACCOUNT
  {
    label: "Account",
    icon: UserIcon,
    defaultOpen: false,
    items: [
      { title: "Profile", url: "/user/profile", icon: UserIcon },
      { title: "Account Settings", url: "/user/account", icon: SettingsIcon },
      {
        title: "API Keys",
        url: "/user/api-keys",
        icon: KeyIcon,
        requiresPlan: ["PRO", "TEAM"],
      },
    ],
  },

  // 7. HELP & DOCS
  {
    label: "Help & Docs",
    icon: BookOpenIcon,
    defaultOpen: false,
    items: [
      { title: "Documentation", url: "/docs", icon: BookOpenIcon },
      { title: "Help Center", url: "/help", icon: HelpCircleIcon },
    ],
  },
];

// ============================================================================
// NAV GROUP COMPONENT
// ============================================================================

function NavGroup({
  section,
  isActive,
  isOpen,
  onToggle,
}: {
  section: MenuSection;
  isActive: (url: string) => boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span>{section.label}</span>
        </div>
        {isOpen ? (
          <ChevronDownIcon className="h-3.5 w-3.5" />
        ) : (
          <ChevronRightIcon className="h-3.5 w-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="ml-2 space-y-0.5 border-l border-white/5 pl-2">
          {section.items.map((item) => {
            const active = isActive(item.url);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white text-black font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{item.title}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white border-red-500 text-[10px] px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export function UserSidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const plan = session?.user?.plan as "FREE" | "PRO" | "TEAM" | undefined;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      menuSections.forEach((section) => {
        initial[section.label] = section.defaultOpen || false;
      });
      return initial;
    },
  );

  const isActive = (url: string) => {
    if (url === "/user/dashboard")
      return pathname === "/user/dashboard" || pathname === "/user";
    return pathname === url || pathname.startsWith(url + "/");
  };

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const filteredSections = menuSections.map((section) => {
    if (section.label === "Account") {
      return {
        ...section,
        items: section.items.filter(
          (item) =>
            !item.requiresPlan ||
            (plan && item.requiresPlan.includes(plan as "PRO" | "TEAM")),
        ),
      };
    }
    return section;
  });

  return (
    <aside
      className={`flex h-full w-full shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3 lg:w-60 ${className}`}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        <nav className="space-y-2">
          {filteredSections.map((section) => {
            if (section.items.length === 0) return null;

            return (
              <NavGroup
                key={section.label}
                section={section}
                isActive={isActive}
                isOpen={openSections[section.label] || false}
                onToggle={() => toggleSection(section.label)}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
