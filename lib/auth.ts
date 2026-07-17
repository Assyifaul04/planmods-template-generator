import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

// 1. IMPORT PRISMA DARI FILE SINGLETON YANG SUDAH ANDA BUAT
import prisma from "./prisma"; 
// ATAU gunakan alias path jika sudah diatur: import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    // WAJIB pakai JWT agar bisa terbaca di middleware
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Opsional: Jika butuh force select account di Google
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    // 1. Masukkan data dari database (user) ke dalam JWT (token)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as "ADMIN" | "USER";
      }
      return token;
    },
    // 2. Masukkan data dari JWT (token) ke dalam Session untuk dipakai di Client (React)
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
  pages: {
    // Redirect ke halaman ini saat fungsi signIn() dipanggil
    signIn: "/login",
  },
};