import type { Metadata } from "next";

import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";

export const metadata: Metadata = {
  title: "Features | PlanMod Template Generator",
  description:
    "Explore all features of PlanMod Template Generator for creating Minecraft Java Mods and Bedrock Add-ons.",
};

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12 lg:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
          Features
        </p>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight lg:text-6xl">
          Everything you need to build Minecraft projects.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          PlanMod Template Generator helps developers generate
          production-ready Minecraft templates for Java and Bedrock,
          publish them to GitHub, download ZIP packages, and open
          projects directly in Visual Studio Code.
        </p>
      </section>

      <HowItWorks />

      <FeaturesGrid />

      {/* Future Sections */}

      {/* SupportedPlatforms */}
      {/* Dependencies */}
      {/* GitHubIntegration */}
      {/* VSCodeIntegration */}
      {/* FAQ */}
    </>
  );
}