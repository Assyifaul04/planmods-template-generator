import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { NextAuthProvider } from "@/components/session-provider";
import SplashScreen from "@/components/splash-screen";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PlanMod — Generator Template Perencanaan",
  description:
    "PlanMod merakit kerangka rencana proyek, roadmap, dan dokumen kerja lain dari jawaban singkat Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <NextAuthProvider>
          <SplashScreen>{children}</SplashScreen>
        </NextAuthProvider>
      </body>
    </html>
  );
}