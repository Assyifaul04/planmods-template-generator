import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Mengambil token JWT dari session berjalan
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as string | undefined;
  const isAdmin = role === "ADMIN"; // Hanya cek ADMIN sesuai Prisma Schema baru

  // ==========================================
  // 1. Proteksi route khusus ADMIN (/dashboard)
  // ==========================================
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      // Jika belum login, redirect ke /login dengan membawa URL tujuan awal
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (!isAdmin) {
      // Jika rolenya USER biasa (bukan ADMIN), lempar kembali ke halaman utama
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ==========================================
  // 2. Proteksi route Auth (/login)
  // ==========================================
  if (pathname.startsWith("/login") && token) {
    // Jika sudah memiliki token (sudah login), cegah akses halaman login
    if (isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Izinkan request untuk route lainnya
  return NextResponse.next();
}

export const config = {
  // Tentukan path mana saja yang akan memicu middleware ini berjalan
  matcher: ["/login", "/dashboard/:path*"],
};