// components/user/user-sidebar.tsx
"use client";

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
} from "lucide-react";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  requiresPlan?: ("PRO" | "TEAM")[];
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

// Dashboard section
const dashboardItems: MenuItem[] = [
  {
    title: "Overview",
    url: "/user/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Notifications",
    url: "/user/notifications",
    icon: BellIcon,
  },
  {
    title: "Downloads",
    url: "/user/downloads",
    icon: DownloadIcon,
  },
  {
    title: "Activity Log",
    url: "/user/activity",
    icon: HistoryIcon,
  },
];

// Generator section
const generatorItems: MenuItem[] = [
  {
    title: "Generate Project",
    url: "/user/generator",
    icon: HammerIcon,
  },
  {
    title: "My Projects",
    url: "/user/projects",
    icon: FolderIcon,
  },
  {
    title: "Templates",
    url: "/user/templates",
    icon: PackageIcon,
  },
  {
    title: "GitHub",
    url: "/user/github",
    icon: GithubIcon,
  },
];

// Account section
const accountItems: MenuItem[] = [
  {
    title: "Profile",
    url: "/user/profile",
    icon: UserIcon,
  },
  {
    title: "Billing & Plan",
    url: "/user/billing",
    icon: CreditCardIcon,
  },
  {
    title: "API Keys",
    url: "/user/api-keys",
    icon: KeyIcon,
    requiresPlan: ["PRO", "TEAM"],
  },
];

function NavGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: MenuItem[];
  isActive: (url: string) => boolean;
}) {
  return (
    <div>
      <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <div className="mt-1.5 space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.url);
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-white text-black font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function UserSidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const plan = session?.user?.plan as "FREE" | "PRO" | "TEAM" | undefined;

  const isActive = (url: string) => {
    // Exact match for dashboard
    if (url === "/user/dashboard") return pathname === "/user/dashboard" || pathname === "/user";
    return pathname === url || pathname.startsWith(url + "/");
  };

  // Filter account items based on user's plan
  const visibleAccountItems = accountItems.filter(
    (item) => !item.requiresPlan || (plan && item.requiresPlan.includes(plan as "PRO" | "TEAM"))
  );

  return (
    <aside
      className={`flex h-full w-full shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3 lg:w-60 ${className}`}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        <nav className="space-y-5">
          <NavGroup label="Dashboard" items={dashboardItems} isActive={isActive} />
          <NavGroup label="Generator" items={generatorItems} isActive={isActive} />
          {visibleAccountItems.length > 0 && (
            <NavGroup label="Account" items={visibleAccountItems} isActive={isActive} />
          )}
        </nav>
      </div>
    </aside>
  );
}