import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh flex-col bg-black">
      <Navbar />
      <main className="flex-1 bg-black text-white">{children}</main>
      <Footer />
    </div>
  );
}