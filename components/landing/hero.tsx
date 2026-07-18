"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkles, Code2, Box, Cuboid, LayoutDashboard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userRole = session?.user?.role;

  // Function to handle dashboard navigation
  const handleDashboardClick = () => {
    if (userRole === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/user/dashboard");
    }
  };

  // Function to handle "Start Building" click
  const handleStartBuilding = () => {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push("/dashboard/projects/create");
    }
  };

  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* Ambient backdrop — forge glow + faint isometric grid, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <Badge
              variant="outline"
              className="gap-2 border-white/15 bg-white/[0.03] font-mono text-[11px] tracking-widest text-[#a1a1a1]"
            >
              <Sparkles className="size-3 text-orange-400" />
              PLANMOD TEMPLATE GENERATOR
            </Badge>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white lg:text-6xl">
              Generate Minecraft
              <br />
              Mod Templates
              <span className="block bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                in seconds.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#a1a1a1]">
              Create professional starter projects for{" "}
              <strong className="font-semibold text-white">Fabric</strong>,{" "}
              <strong className="font-semibold text-white">Forge</strong>,{" "}
              <strong className="font-semibold text-white">NeoForge</strong>,{" "}
              <strong className="font-semibold text-white">Paper</strong>, and{" "}
              <strong className="font-semibold text-white">
                Bedrock Add-ons
              </strong>
              . Generate, download as ZIP, publish directly to GitHub, and
              open instantly in Visual Studio Code.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {/* Start Building Button */}
              <Button
                size="lg"
                onClick={handleStartBuilding}
                className="bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-200 hover:bg-white/90 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
              >
                {isLoggedIn ? "Start Building" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Dashboard Button - Only show when logged in */}
              {isLoggedIn && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleDashboardClick}
                  className="border-white/15 bg-transparent text-white hover:border-white/30 hover:bg-white/[0.06]"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#a1a1a1]">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-orange-400" />
                GitHub Integration
              </div>
              <div className="flex items-center gap-2">
                <Box className="size-4 text-orange-400" />
                ZIP Generator
              </div>
              <div className="flex items-center gap-2">
                <Cuboid className="size-4 text-orange-400" />
                Java &amp; Bedrock
              </div>
            </div>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
              Fabric &middot; Forge &middot; NeoForge &middot; Paper &middot;
              Bedrock &middot; VS Code &middot; GitHub
            </p>
          </div>

          {/* Right — hero artwork, no card/background around it */}
          <div className="relative mx-auto flex w-full max-w-lg items-center justify-center lg:max-w-none">
            <Image
              src="/image/Hero.png"
              alt="PlanMod"
              width={800}
              height={800}
              priority
              className="h-auto w-full select-none object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}