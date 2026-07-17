import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Next.js App Router memerlukan export method GET dan POST
export { handler as GET, handler as POST }