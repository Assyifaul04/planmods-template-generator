import type { Metadata } from "next";

import { DocsSidebar } from "@/components/docs/docs-sidebar";

export const metadata: Metadata = {
  title: "Documentation | PlanMod Template Generator",
  description: "Documentation for PlanMod Template Generator.",
};

const steps = [
  "Login using GitHub or Google.",
  "Create a new project.",
  "Select a template.",
  "Configure your project.",
  "Generate ZIP.",
  "Push to GitHub.",
  "Open in VS Code.",
];

export default function DocsPage() {
  return (
    <section className="mx-auto flex max-w-7xl bg-black">
      <DocsSidebar />

      <main className="flex-1 px-6 py-12 sm:px-10 lg:px-16">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-orange-400">
          Documentation
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Getting Started
        </h1>

        <p className="mt-6 max-w-3xl leading-8 text-[#a1a1a1]">
          Welcome to the PlanMod Template Generator documentation. Learn how
          to generate Minecraft Java and Bedrock development templates,
          connect GitHub, generate ZIP projects, and open them directly in
          Visual Studio Code.
        </p>

        <div className="mt-10 max-w-3xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white">Quick Start</h2>

          <ol className="mt-5 space-y-3.5">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/15 font-mono text-[11px] text-white/50">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-[#c9c9c9]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </section>
  );
}