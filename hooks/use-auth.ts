'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
  logout: () => void
}

export function useAuth(): AuthContextType {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('adminToken')
    if (storedToken) {
      setToken(storedToken)
      setIsAuthenticated(true)
      // Also set it in cookies for server-side middleware
      document.cookie = `adminToken=${storedToken}; path=/; max-age=86400`
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('adminToken')
    document.cookie = 'adminToken=; path=/; max-age=0'
    setToken(null)
    setIsAuthenticated(false)
    router.push('/login')
  }

  return {
    isAuthenticated,
    token,
    loading,
    logout,
  }
}
