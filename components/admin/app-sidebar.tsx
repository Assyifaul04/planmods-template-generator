// components/admin/app-sidebar.tsx
"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

import { NavDocuments } from "@/components/admin/nav-documents"
import { NavMain } from "@/components/admin/nav-main"
import { NavSecondary } from "@/components/admin/nav-secondary"
import { NavUser } from "@/components/admin/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
  PackageIcon,
  TagIcon,
  GitBranchIcon,
  ActivityIcon,
  BellIcon,
  KeyIcon,
  ShieldIcon,
  ServerIcon,
  DownloadIcon,
  StarIcon,
  ClockIcon,
} from "lucide-react"

// Function to get menu items based on user role
const getNavItems = (role?: string) => {
  // Admin only items
  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: <UsersIcon className="h-4 w-4" />,
      items: [
        { title: "All Users", url: "/admin/users" },
        { title: "Roles & Permissions", url: "/admin/users/roles" },
        { title: "Banned Users", url: "/admin/users/banned" },
      ],
    },
    {
      title: "Projects",
      url: "/admin/projects",
      icon: <FolderIcon className="h-4 w-4" />,
      items: [
        { title: "All Projects", url: "/admin/projects" },
        { title: "Project Status", url: "/admin/projects/status" },
        { title: "Visibility Settings", url: "/admin/projects/visibility" },
        { title: "Archived Projects", url: "/admin/projects/archived" },
      ],
    },
    {
      title: "Templates",
      url: "/admin/templates",
      icon: <PackageIcon className="h-4 w-4" />,
      items: [
        { title: "All Templates", url: "/admin/templates" },
        { title: "Add Template", url: "/admin/templates/new" },
        { title: "Tags Management", url: "/admin/templates/tags" },
        { title: "Featured Templates", url: "/admin/templates/featured" },
      ],
    },
    {
      title: "Tags",
      url: "/admin/tags",
      icon: <TagIcon className="h-4 w-4" />,
    },
    {
      title: "GitHub Repositories",
      url: "/admin/repositories",
      icon: <GitBranchIcon className="h-4 w-4" />,
      items: [
        { title: "All Repositories", url: "/admin/repositories" },
        { title: "Sync Status", url: "/admin/repositories/sync" },
        { title: "Webhook Management", url: "/admin/repositories/webhooks" },
      ],
    },
    {
      title: "Build History",
      url: "/admin/builds",
      icon: <ServerIcon className="h-4 w-4" />,
      items: [
        { title: "All Builds", url: "/admin/builds" },
        { title: "Failed Builds", url: "/admin/builds/failed" },
        { title: "Build Queue", url: "/admin/builds/queue" },
        { title: "Build Statistics", url: "/admin/builds/statistics" },
      ],
    },
    {
      title: "Activity Logs",
      url: "/admin/activity",
      icon: <ActivityIcon className="h-4 w-4" />,
      items: [
        { title: "All Activities", url: "/admin/activity" },
        { title: "User Activities", url: "/admin/activity/users" },
        { title: "System Activities", url: "/admin/activity/system" },
      ],
    },
    {
      title: "Downloads",
      url: "/admin/downloads",
      icon: <DownloadIcon className="h-4 w-4" />,
      items: [
        { title: "Download History", url: "/admin/downloads" },
        { title: "Download Statistics", url: "/admin/downloads/statistics" },
        { title: "Popular Projects", url: "/admin/downloads/popular" },
      ],
    },
    {
      title: "Stars & Favorites",
      url: "/admin/stars",
      icon: <StarIcon className="h-4 w-4" />,
    },
    {
      title: "Notifications",
      url: "/admin/notifications",
      icon: <BellIcon className="h-4 w-4" />,
      items: [
        { title: "All Notifications", url: "/admin/notifications" },
        { title: "Send Notification", url: "/admin/notifications/send" },
        { title: "Templates", url: "/admin/notifications/templates" },
      ],
    },
    {
      title: "API Keys",
      url: "/admin/api-keys",
      icon: <KeyIcon className="h-4 w-4" />,
      items: [
        { title: "All API Keys", url: "/admin/api-keys" },
        { title: "Revoked Keys", url: "/admin/api-keys/revoked" },
        { title: "Usage Statistics", url: "/admin/api-keys/statistics" },
      ],
    },
    {
      title: "System Settings",
      url: "/admin/settings",
      icon: <Settings2Icon className="h-4 w-4" />,
      items: [
        { title: "General Settings", url: "/admin/settings/general" },
        { title: "Security", url: "/admin/settings/security" },
        { title: "Maintenance", url: "/admin/settings/maintenance" },
      ],
    },
  ]

  // Secondary menu items (bottom of sidebar)
  const secondaryItems = [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: <Settings2Icon className="h-4 w-4" />,
    },
    {
      title: "Get Help",
      url: "/admin/help",
      icon: <CircleHelpIcon className="h-4 w-4" />,
    },
    {
      title: "Search",
      url: "/admin/search",
      icon: <SearchIcon className="h-4 w-4" />,
    },
  ]

  // Document library items
  const documentItems = [
    {
      name: "Data Library",
      url: "/admin/data-library",
      icon: <DatabaseIcon className="h-4 w-4" />,
    },
    {
      name: "Reports",
      url: "/admin/reports",
      icon: <FileChartColumnIcon className="h-4 w-4" />,
      items: [
        { title: "User Reports", url: "/admin/reports/users" },
        { title: "Project Reports", url: "/admin/reports/projects" },
        { title: "Build Reports", url: "/admin/reports/builds" },
        { title: "Download Reports", url: "/admin/reports/downloads" },
      ],
    },
    {
      name: "Word Assistant",
      url: "/admin/word-assistant",
      icon: <FileIcon className="h-4 w-4" />,
    },
  ]

  // Return based on role
  if (role === "ADMIN") {
    return {
      navMain: adminItems,
      navDocuments: documentItems,
      navSecondary: secondaryItems,
    }
  }

  // For non-admin users, return empty or minimal items
  return {
    navMain: [],
    navDocuments: [],
    navSecondary: [],
  }
}

// Default user data (will be replaced with actual session data)
const defaultUser = {
  name: "Admin User",
  email: "admin@example.com",
  avatar: "/avatars/admin.jpg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect non-admin users
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/user")
    }
  }, [status, session, router])

  // Get user data from session or use default
  const userData = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || "",
        role: session.user.role,
      }
    : defaultUser

  // Get menu items based on user role
  const { navMain, navDocuments, navSecondary } = getNavItems(userData.role)

  // Show loading state
  if (status === "loading") {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2 px-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  // If not admin, return null (will be redirected)
  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return null
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin/dashboard" className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 transition-colors">
              {/* Logo with image from public/image/logo.png */}
              <div className="relative size-6 overflow-hidden rounded-md">
                <Image
                  src="/image/logo.png"
                  alt="PlanMod Logo"
                  fill
                  sizes="24px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-base font-semibold">Planmods</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navMain.length > 0 && <NavMain items={navMain} />}
        {navDocuments.length > 0 && <NavDocuments items={navDocuments} />}
        {navSecondary.length > 0 && (
          <NavSecondary items={navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}