import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Code2,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";


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

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/templates", label: "Templates" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Templates",
    links: [
      { href: "/templates/fabric", label: "Fabric" },
      { href: "/templates/forge", label: "Forge" },
      { href: "/templates/neoforge", label: "NeoForge" },
      { href: "/templates/paper", label: "Paper" },
      { href: "/templates/bedrock", label: "Bedrock" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs/api", label: "API Reference" },
      { href: "/docs/github", label: "GitHub Integration" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "/support", label: "Support" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-6">
          {/* Logo */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden">
                <Image
                  src="/image/logo.png"
                  alt="Planmods"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h3 className="font-semibold tracking-tight text-white">
                  Planmods
                </h3>

                <p className="text-xs text-white/40">
                  Template Generator
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              Generate professional Minecraft starter templates for
              Fabric, Forge, NeoForge, Paper, and Bedrock.
              Download as ZIP, publish directly to GitHub,
              and continue developing instantly in Visual Studio Code.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="https://github.com"
                className="rounded-lg border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="h-4 w-4" />
              </Link>

              <Link
                href="/docs"
                className="rounded-lg border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <BookOpen className="h-4 w-4" />
              </Link>

              <Link
                href="/templates"
                className="rounded-lg border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Code2 className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
                {column.title}
              </h4>

              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-white/40">
            © {new Date().getFullYear()} Planmods Template Generator.
            All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/privacy"
              className="text-white/40 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-white/40 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>

            <Link
              href="/licenses"
              className="text-white/40 transition-colors hover:text-white"
            >
              Licenses
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}