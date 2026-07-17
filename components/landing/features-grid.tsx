import {
  Blocks,
  FileArchive,
  Code2,
  Box,
  WandSparkles,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Blocks,
    title: "Multi-Platform Templates",
    description:
      "Generate starter projects for Fabric, Forge, NeoForge, Paper, and Bedrock Add-ons with the latest project structure.",
  },
  {
    icon: WandSparkles,
    title: "Automatic Project Generator",
    description:
      "Simply enter your project name, package, mod ID, Minecraft version, and dependencies. PlanMod generates everything automatically.",
  },
  {
    icon: FileArchive,
    title: "Instant ZIP Export",
    description:
      "Download a ready-to-use project as a ZIP file complete with Gradle configuration, resources, and source code structure.",
  },
  {
    icon: Code2,
    title: "GitHub Integration",
    description:
      "Create a GitHub repository, push the generated project, and manage your source code without leaving PlanMod.",
  },
  {
    icon: Code2,
    title: "Open in VS Code",
    description:
      "Launch your generated project directly in Visual Studio Code or vscode.dev and start coding immediately.",
  },
  {
    icon: Box,
    title: "Java & Bedrock Support",
    description:
      "Develop Minecraft Java Mods and Bedrock Add-ons from one platform using modern templates and best practices.",
  },
];

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="border-t bg-secondary/20"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
            Features
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-5xl">
            Everything you need to build Minecraft projects faster.
          </h2>

          <p className="mt-6 text-muted-foreground leading-relaxed">
            PlanMod provides everything required to generate, customize,
            manage, and publish Minecraft development templates from a
            single platform.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon
                    className="h-6 w-6"
                    strokeWidth={1.8}
                  />
                </div>

                <CardTitle className="text-lg">
                  {feature.title}
                </CardTitle>

                <CardDescription className="leading-7">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}