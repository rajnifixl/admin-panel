"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Lock, Mail } from "lucide-react"
// import { setToken, getToken } from "@/lib/api"
// ✅ Yeh karo - setToken add karo
import { authFetch, getToken, setToken } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ✅ Safe redirect - only run once after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = getToken()
    if (token) {
      router.replace("/dashboard")
    }
  }, [mounted, router])
  const handleLogin = async (e: React.FormEvent) => {
    console.log("🔘 Login button clicked")
    e.preventDefault()
    console.log("✅ Form prevented default")

    if (!email || !password) {
      console.log("❌ Validation failed: email or password empty")
      toast.error("Please fill in all fields")
      return
    }
    console.log("✅ Validation passed")

    setLoading(true)
    console.log("🔄 Loading state set to true")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      console.log("🔗 Backend URL:", backendUrl)
      
      if (!backendUrl) {
        console.error("❌ NEXT_PUBLIC_BACKEND_URL is not defined!")
        toast.error("Configuration error: Backend URL not set")
        setLoading(false)
        return
      }

      console.log("📡 Sending login request to:", `${backendUrl}/api/user/admin`)
      const response = await fetch(`${backendUrl}/api/user/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      const data = await response.json()
      console.log("📋 Full API Response:", data)
      console.log("  - success:", data.success)
      console.log("  - message:", data.message)
      console.log("  - token exists:", !!data.token)
      console.log("  - token length:", data.token?.length || 0)

      if (data.success && data.token) {
        console.log("✅ Login successful!")
        console.log("💾 Token to save:", data.token.substring(0, 20) + "...")
        
        // Save token using unified helper
        setToken(data.token)
        console.log("✅ Token saved via setToken()")
        
        // Verify token was saved
        const savedToken = getToken()
        console.log("🔍 Token in localStorage:", savedToken ? savedToken.substring(0, 20) + "..." : "NULL!")
        
        toast.success("✅ Login successful!")
        setRedirecting(true)
        console.log("🚀 Redirecting to dashboard...")
        
        // Use replace instead of push to avoid history stack issues
        router.replace("/dashboard")
      } else {
        console.error("❌ Login failed:", data.message)
        toast.error(data.message || "Login failed")
      }
    } catch (error) {
      console.error("❌ Catch block error:", error)
      console.error("  - Error message:", (error as Error).message)
      toast.error("Failed to login: " + (error as Error).message)
    } finally {
      setLoading(false)
      console.log("🔄 Loading state set to false")
    }
  }

  // Debug: Check if token exists on mount (for testing)
  console.log("🔍 Current token on page load:", getToken() ? getToken().substring(0, 20) + "..." : "No token")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@shop.com"
                  value={email}
                  onChange={(e) => {
                    console.log("📝 Email changed:", e.target.value)
                    setEmail(e.target.value)
                  }}
                  inputMode="email"
                  maxLength="255"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    console.log("📝 Password changed: [hidden]")
                    setPassword(e.target.value)
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <Button type="submit" disabled={loading || redirecting} className="w-full">
              {loading ? "Logging in..." : redirecting ? "Redirecting..." : "Login"}
            </Button>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Demo Credentials:</p>
              <p className="text-xs text-muted-foreground">
                Email: <code className="bg-background px-2 py-1 rounded">admin@shop.com</code>
              </p>
              <p className="text-xs text-muted-foreground">
                Password: <code className="bg-background px-2 py-1 rounded">admin123</code>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}