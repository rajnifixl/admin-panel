"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SalesChart } from "@/components/admin/sales-chart"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { RecentOrders } from "@/components/admin/recent-orders"
import { TopProducts } from "@/components/admin/top-products"
import { TrafficChart } from "@/components/admin/traffic-chart"
import { DollarSign, ShoppingCart, Users, Package, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { authFetch, getToken } from "@/lib/api"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    loading: true,
  })
  const [authReady, setAuthReady] = useState(false)

  // ✅ Wait for auth to be ready before making API calls
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken()
      if (token) {
        setAuthReady(true)
      } else {
        // Token not found - this shouldn't happen if AdminLayout is working
        // But handle it gracefully
        console.warn("⚠️ No token found in Dashboard - auth may have been lost")
      }
    }

    // Small delay to ensure AdminLayout has completed auth check
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  // ✅ Only fetch data after auth is confirmed
  useEffect(() => {
    if (!authReady) return

    const fetchStats = async () => {
      console.log("📊 Fetching dashboard stats...")
      try {
        const [ordersData, productsData, usersData] = await Promise.all([
          authFetch("/api/order/list"),
          authFetch("/api/product/list"),
          authFetch("/api/user/list"),
        ])

        const orders = ordersData.success ? ordersData.orders : []
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: productsData.success ? productsData.products?.length || 0 : 0,
          totalCustomers: usersData.success ? usersData.users?.length || 0 : 0,
          loading: false,
        })
        console.log("✅ Dashboard stats loaded")
      } catch (err: any) {
        console.error("❌ Dashboard fetch error:", err.message)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [authReady])

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.loading ? "..." : `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Orders",
      value: stats.loading ? "..." : stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Products",
      value: stats.loading ? "..." : stats.totalProducts.toString(),
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Customers",
      value: stats.loading ? "..." : stats.totalCustomers.toString(),
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Stats Grid — REAL DATA */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">Live</span>
                      <span className="text-sm text-muted-foreground">from DB</span>
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <SalesChart />
          <RevenueChart />
        </div>

        {/* Second Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TopProducts />
          <TrafficChart />
        </div>

        {/* Recent Orders — REAL DATA */}
        <RecentOrders />
      </div>
    </AdminLayout>
  )
}