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
  UsersIcon,
  FolderIcon,
  PackageIcon,
  TagIcon,
  GitBranchIcon,
  ServerIcon,
  ActivityIcon,
  DownloadIcon,
  StarIcon,
  BellIcon,
  KeyIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  LayersIcon,
  ShieldIcon,
  ClockIcon,
  ListIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
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
        { title: "User Roles", url: "/admin/users/roles" },
        { title: "User Plans", url: "/admin/users/plans" },
        { title: "Banned Users", url: "/admin/users/banned" },
        { title: "Activity Logs", url: "/admin/users/activity" },
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
        { title: "Collaborators", url: "/admin/projects/collaborators" },
        { title: "Project Configs", url: "/admin/projects/configs" },
      ],
    },
    {
      title: "Minecraft Versions",
      url: "/admin/versions",
      icon: <LayersIcon className="h-4 w-4" />,
      items: [
        { title: "All Versions", url: "/admin/versions" },
        { title: "Add Version", url: "/admin/versions/new" },
        { title: "Loaders", url: "/admin/versions/loaders" },
        { title: "Loader Mappings", url: "/admin/versions/mappings" },
        { title: "Latest Versions", url: "/admin/versions/latest" },
        { title: "Snapshots", url: "/admin/versions/snapshots" },
      ],
    },
    {
      title: "Templates",
      url: "/admin/templates",
      icon: <PackageIcon className="h-4 w-4" />,
      items: [
        { title: "All Templates", url: "/admin/templates" },
        { title: "Add Template", url: "/admin/templates/new" },
        { title: "Template Repositories", url: "/admin/templates/repos" },
        { title: "Tags Management", url: "/admin/templates/tags" },
        { title: "Featured Templates", url: "/admin/templates/featured" },
        { title: "Template Usage", url: "/admin/templates/usage" },
      ],
    },
    {
      title: "Tags",
      url: "/admin/tags",
      icon: <TagIcon className="h-4 w-4" />,
      items: [
        { title: "All Tags", url: "/admin/tags" },
        { title: "Add Tag", url: "/admin/tags/new" },
        { title: "Tag Usage", url: "/admin/tags/usage" },
        { title: "Template Tags", url: "/admin/tags/templates" },
      ],
    },
    {
      title: "GitHub Repositories",
      url: "/admin/repositories",
      icon: <GitBranchIcon className="h-4 w-4" />,
      items: [
        { title: "All Repositories", url: "/admin/repositories" },
        { title: "Sync Status", url: "/admin/repositories/sync" },
        { title: "Webhook Management", url: "/admin/repositories/webhooks" },
        { title: "Repository Stats", url: "/admin/repositories/stats" },
        { title: "Failed Syncs", url: "/admin/repositories/failed" },
      ],
    },
    {
      title: "Build History",
      url: "/admin/builds",
      icon: <ServerIcon className="h-4 w-4" />,
      items: [
        { title: "All Builds", url: "/admin/builds" },
        { title: "Build Status", url: "/admin/builds/status" },
        { title: "Pending Builds", url: "/admin/builds/pending" },
        { title: "Running Builds", url: "/admin/builds/running" },
        { title: "Failed Builds", url: "/admin/builds/failed" },
        { title: "Successful Builds", url: "/admin/builds/successful" },
        { title: "Build Queue", url: "/admin/builds/queue" },
        { title: "Build Statistics", url: "/admin/builds/statistics" },
        { title: "Build Duration", url: "/admin/builds/duration" },
      ],
    },
    {
      title: "Activity Logs",
      url: "/admin/activity",
      icon: <ActivityIcon className="h-4 w-4" />,
      items: [
        { title: "All Activities", url: "/admin/activity" },
        { title: "User Activities", url: "/admin/activity/users" },
        { title: "Project Activities", url: "/admin/activity/projects" },
        { title: "System Activities", url: "/admin/activity/system" },
        { title: "Activity Stats", url: "/admin/activity/stats" },
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
        { title: "Top Users", url: "/admin/downloads/top-users" },
        { title: "Daily Downloads", url: "/admin/downloads/daily" },
      ],
    },
    {
      title: "Stars & Favorites",
      url: "/admin/stars",
      icon: <StarIcon className="h-4 w-4" />,
      items: [
        { title: "All Stars", url: "/admin/stars" },
        { title: "Popular Projects", url: "/admin/stars/popular" },
        { title: "User Favorites", url: "/admin/stars/users" },
        { title: "Star Statistics", url: "/admin/stars/statistics" },
      ],
    },
    {
      title: "Notifications",
      url: "/admin/notifications",
      icon: <BellIcon className="h-4 w-4" />,
      items: [
        { title: "All Notifications", url: "/admin/notifications" },
        { title: "Send Notification", url: "/admin/notifications/send" },
        { title: "Notification Types", url: "/admin/notifications/types" },
        { title: "Read Status", url: "/admin/notifications/read" },
        { title: "Notification Templates", url: "/admin/notifications/templates" },
      ],
    },
    {
      title: "API Keys",
      url: "/admin/api-keys",
      icon: <KeyIcon className="h-4 w-4" />,
      items: [
        { title: "All API Keys", url: "/admin/api-keys" },
        { title: "Active Keys", url: "/admin/api-keys/active" },
        { title: "Revoked Keys", url: "/admin/api-keys/revoked" },
        { title: "Expired Keys", url: "/admin/api-keys/expired" },
        { title: "Usage Statistics", url: "/admin/api-keys/statistics" },
        { title: "Key Scopes", url: "/admin/api-keys/scopes" },
      ],
    },
    {
      title: "Security",
      url: "/admin/security",
      icon: <ShieldIcon className="h-4 w-4" />,
      items: [
        { title: "Security Overview", url: "/admin/security" },
        { title: "User Sessions", url: "/admin/security/sessions" },
        { title: "Account Activity", url: "/admin/security/accounts" },
        { title: "Verification Tokens", url: "/admin/security/verification" },
        { title: "Security Settings", url: "/admin/security/settings" },
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
        { title: "System Status", url: "/admin/settings/status" },
        { title: "Backup", url: "/admin/settings/backup" },
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
      items: [
        { title: "Database Stats", url: "/admin/data-library/stats" },
        { title: "Data Export", url: "/admin/data-library/export" },
        { title: "Data Import", url: "/admin/data-library/import" },
      ],
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
        { title: "Template Reports", url: "/admin/reports/templates" },
        { title: "Activity Reports", url: "/admin/reports/activity" },
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
          <Link href="/" className="group flex shrink-0 items-center">
            <span className="relative flex h-12 w-32 md:h-14 md:w-36 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/image/logo1.png"
                alt="PlanMod"
                fill
                sizes="(max-width: 766px) 126px, 142px"
                className="object-contain"
                priority
              />
            </span>
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