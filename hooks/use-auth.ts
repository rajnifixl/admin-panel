"use client"

import { useRouter } from "next/navigation"
import { removeToken, getToken } from "@/lib/api"

export function useAuth() {
  const router = useRouter()

  const logout = () => {
    removeToken()
    router.push("/login")
  }

  const isAuthenticated = () => {
    return !!getToken()
  }

  return {
    logout,
    isAuthenticated,
  }
}