import { Badge } from "@/components/ui/badge";

export function FeatureHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <Badge>PLANMOD FEATURES</Badge>

      <h1 className="mt-6 text-5xl font-bold">
        Everything You Need to Build Minecraft Mods Faster
      </h1>

      <p className="mt-6 max-w-3xl text-muted-foreground leading-8">
        Generate Minecraft Java and Bedrock starter projects,
        push directly to GitHub, download ZIP packages,
        and open your project instantly in Visual Studio Code.
      </p>
    </section>
  );
}