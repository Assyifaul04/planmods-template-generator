// app/user/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserSidebar } from "@/components/user/user-sidebar";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (pathname === "/user") {
      router.replace("/user/dashboard");
    }
  }, [pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex items-center gap-2 text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:px-6">
        <UserSidebar className="sticky top-20 hidden h-[calc(100vh-6rem)] w-60 shrink-0 lg:block" />
        <main className="min-w-0 flex-1 bg-black px-4 pt-4 pb-8 lg:px-8 lg:pt-6 lg:pb-12">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}