// components/user/user-sidebar-menu.tsx

import {
  LayoutDashboardIcon,
  FolderIcon,
  FolderPlusIcon,
  FileArchiveIcon,
  GitBranchIcon,
  DownloadIcon,
  HistoryIcon,
  BookOpenIcon,
  BookIcon,
  Code2Icon,
  HelpCircleIcon,
  UserIcon,
  SettingsIcon,
  BellIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
  ClockIcon,
  BoxIcon,
  PackageIcon,
  FileCodeIcon,
  TerminalIcon,
} from "lucide-react";

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

export const userMenuItems = {
  // Dashboard
  dashboard: {
    title: "Dashboard",
    icon: LayoutDashboardIcon,
    items: [
      { title: "Overview", url: "/user" },
      { title: "Statistics", url: "/user/statistics" },
    ],
  },

  // Projects
  projects: {
    title: "Projects",
    icon: FolderIcon,
    items: [
      { title: "My Projects", url: "/user/projects" },
      { title: "Create Project", url: "/user/projects/create" },
      { title: "Draft Projects", url: "/user/projects/drafts" },
      { title: "Archived Projects", url: "/user/projects/archived" },
      { title: "Starred Projects", url: "/user/projects/starred" },
      { title: "Collaborations", url: "/user/projects/collaborations" },
    ],
  },

  // Templates
  templates: {
    title: "Templates",
    icon: PackageIcon,
    items: [
      { title: "Browse Templates", url: "/user/templates" },
      { title: "Fabric", url: "/user/templates/fabric" },
      { title: "Forge", url: "/user/templates/forge" },
      { title: "NeoForge", url: "/user/templates/neoforge" },
      { title: "Paper", url: "/user/templates/paper" },
      { title: "Bedrock Add-on", url: "/user/templates/bedrock-addon" },
      { title: "Bedrock Script API", url: "/user/templates/bedrock-script" },
      { title: "My Templates", url: "/user/templates/my" },
      { title: "Favorite Templates", url: "/user/templates/favorites" },
    ],
  },

  // GitHub Integration
  github: {
    title: "GitHub",
    icon: GithubIcon,
    items: [
      { title: "My Repositories", url: "/user/github/repositories" },
      { title: "Connected Accounts", url: "/user/github/accounts" },
      { title: "Repository Settings", url: "/user/github/settings" },
      { title: "Webhook Status", url: "/user/github/webhooks" },
      { title: "Sync Status", url: "/user/github/sync" },
    ],
  },

  // Downloads & Builds
  downloads: {
    title: "Downloads",
    icon: DownloadIcon,
    items: [
      { title: "ZIP Downloads", url: "/user/downloads" },
      { title: "Build History", url: "/user/builds" },
      { title: "Download History", url: "/user/downloads/history" },
      { title: "Recent Downloads", url: "/user/downloads/recent" },
    ],
  },

  // Documentation
  documentation: {
    title: "Documentation",
    icon: BookOpenIcon,
    items: [
      { title: "Getting Started", url: "/docs" },
      { title: "Installation", url: "/docs/installation" },
      { title: "API Reference", url: "/docs/api" },
      { title: "VS Code Setup", url: "/docs/vscode" },
      { title: "FAQ", url: "/docs/faq" },
      { title: "Tutorials", url: "/docs/tutorials" },
      { title: "Best Practices", url: "/docs/best-practices" },
    ],
  },

  // Profile & Settings
  profile: {
    title: "Profile",
    icon: UserIcon,
    items: [
      { title: "My Profile", url: "/user/profile" },
      { title: "Account Settings", url: "/user/account" },
      { title: "Notifications", url: "/user/notifications" },
      { title: "Security", url: "/user/security" },
      { title: "API Keys", url: "/user/api-keys" },
      { title: "Billing & Plan", url: "/user/billing" },
    ],
  },
};