import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      bronzeTokens: number
      silverTokens: number
      goldTokens: number
      hasClaimedBonus: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    bronzeTokens: number
    silverTokens: number
    goldTokens: number
    hasClaimedBonus: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    bronzeTokens: number
    silverTokens: number
    goldTokens: number
    hasClaimedBonus: boolean
  }
}
