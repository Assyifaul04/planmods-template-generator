// components/navbar.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  FolderPlus,
  Download,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DocsDropdown } from "@/components/docs/docs-dropdown";
import { TemplatesDropdown } from "@/components/templates/dropdown-menu";

// Komponen Icon GitHub (Inline SVG) agar bebas dari error import
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

const guestNavItems = [
  { href: "/features", label: "Features" },
  // Templates sudah di-handle oleh TemplatesDropdown
  { href: "/changelog", label: "Changelog" },
];

const userNavItems = [
  // Templates sudah di-handle oleh TemplatesDropdown
];

// Function to get account menu items based on user role
const getAccountMenuItems = (role?: string) => {
  const dashboardPath = role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";

  return [
    { href: dashboardPath, label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/projects/new", label: "Create Project", icon: FolderPlus },
    { href: "/dashboard/repositories", label: "GitHub Repositories", icon: GithubIcon },
    { href: "/dashboard/downloads", label: "Downloads", icon: Download },
  ];
};

const GITHUB_URL = "https://github.com/your-org/your-repo";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const navItems = isLoggedIn ? userNavItems : guestNavItems;

  const accountMenuItems = getAccountMenuItems(user?.role);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handle navigation without asChild
  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled
          ? "border-white/[0.08] bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60"
          : "border-transparent bg-black"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="relative flex size-7 items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/image/logo.png"
                alt="PlanMod"
                fill
                sizes="28px"
                className="object-contain"
                priority
              />
            </span>
            <span className="hidden text-[15px] font-semibold tracking-tight text-white sm:inline">
              Planmods
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    active ? "text-white" : "text-[#a1a1a1] hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-px bg-white" />
                  )}
                </Link>
              );
            })}

            {/* ✅ Templates Dropdown */}
            <TemplatesDropdown />

            {/* Docs Dropdown */}
            <DocsDropdown />

            {!isLoggedIn && (
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium text-[#a1a1a1] transition-colors duration-200 hover:text-white"
              >
                <GithubIcon className="size-4" />
                GitHub
              </Link>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
          ) : !isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="hidden items-center rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-medium text-white transition-all duration-200 hover:border-white/30 hover:bg-white/[0.04] sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden items-center rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black shadow-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md sm:inline-flex"
              >
                Get Started
              </Link>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              {/* ❌ Hapus icon Notifikasi */}
              {/* <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-full text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <Bell className="size-[18px]" />
                {hasNotifications && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 ring-2 ring-black" />
                )}
              </Link> */}

              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex size-9 items-center justify-center rounded-full text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <GithubIcon className="size-[18px]" />
              </Link>

              <span className="mx-1 h-5 w-px bg-white/10" />

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 outline-none transition-colors duration-200 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/30">
                  <div className="pointer-events-none flex items-center gap-1.5">
                    <Avatar className="size-7 ring-1 ring-white/10">
                      <AvatarImage src={user?.image || ""} alt={user?.name ?? "User"} />
                      <AvatarFallback className="bg-[#2a2a2a] text-[11px] text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3.5 text-[#a1a1a1]" />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="z-[100] w-56 border border-white/10 bg-[#0a0a0b] text-white shadow-2xl shadow-black/60"
                >
                  <div className="flex flex-col px-2 py-1.5 text-sm font-semibold truncate">
                    {user?.name}
                    {user?.email && (
                      <span className="block truncate text-xs font-normal text-white/50">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuGroup>
                    {accountMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        className="text-[#d4d4d4] focus:bg-white/[0.08] focus:text-white"
                        onClick={() => handleNavigation(item.href)}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-[#d4d4d4] focus:bg-white/[0.08] focus:text-white"
                      onClick={() => handleNavigation("/profile")}
                    >
                      <UserIcon className="size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[#d4d4d4] focus:bg-white/[0.08] focus:text-white"
                      onClick={() => handleNavigation("/settings")}
                    >
                      <Settings className="size-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-2 text-red-500 focus:bg-red-500/10 focus:text-red-400"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-white/[0.08] bg-black px-4 pb-4 pt-2 lg:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-[#a1a1a1] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            {/* Templates for mobile */}
            <li>
              <Link
                href="/templates"
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <Layers className="mr-2 h-4 w-4" />
                Templates
              </Link>
            </li>

            {/* Docs link for mobile */}
            <li>
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                Docs
              </Link>
            </li>

            {isLoggedIn &&
              accountMenuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              ))}

            {!isLoggedIn && (
              <li>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a1a1a1] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
                >
                  <GithubIcon className="size-4" />
                  GitHub
                </Link>
              </li>
            )}
          </ul>

          <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.08] pt-3">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full border border-white/15 px-3.5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.06]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full bg-white px-3.5 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-white/90"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-red-500/30 px-3.5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}