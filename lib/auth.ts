// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // ✅ Simpan githubId dan githubUsername ke User model
      if (account?.provider === "github" && profile) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: account.providerAccountId,
            githubUsername: (profile as any).login,
          },
        });
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as "ADMIN" | "USER";
      }
      
      // ✅ Store GitHub access token saat login
      if (account && account.provider === "github") {
        token.githubAccessToken = account.access_token;
        token.githubId = account.providerAccountId;
        token.githubUsername = (account as any).login || (user as any).name;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
        session.githubAccessToken = token.githubAccessToken as string;
        session.githubId = token.githubId as string;
        session.githubUsername = token.githubUsername as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};