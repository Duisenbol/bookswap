import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Google, Apple],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.bronzeTokens = user.bronzeTokens
        token.silverTokens = user.silverTokens
        token.goldTokens = user.goldTokens
        token.hasClaimedBonus = user.hasClaimedBonus
      }

      // Allow updating session data
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.bronzeTokens = token.bronzeTokens as number
        session.user.silverTokens = token.silverTokens as number
        session.user.goldTokens = token.goldTokens as number
        session.user.hasClaimedBonus = token.hasClaimedBonus as boolean
      }
      return session
    },
  },
})
