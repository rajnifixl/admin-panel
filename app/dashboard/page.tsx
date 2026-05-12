"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { 
  DollarSign, ShoppingCart, Users, Package, TrendingUp, ArrowUpRight, 
  ArrowDownRight, BarChart3, PieChart, LineChart, Activity, Zap, Target,
  Clock, CheckCircle2, AlertCircle, Eye, Download
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch, getToken } from "@/lib/api"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  })

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const [ordersData, productsData, usersData] = await Promise.all([
          authFetch("/api/order/list"),
          authFetch("/api/product/list"),
          authFetch("/api/user/list"),
        ])

        console.log("✅ ordersData:", ordersData)
        console.log("✅ productsData:", productsData)
        console.log("✅ usersData:", usersData)

        const orders = ordersData?.success ? (ordersData.orders || []) : []
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: productsData?.success ? (productsData.products?.length || 0) : 0,
          totalCustomers: usersData?.success ? (usersData.users?.length || 0) : 0,
        })
      } catch (err: any) {
        console.error("❌ Dashboard fetch error:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const kpiMetrics = [
    {
      id: 1,
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      id: 2,
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      isPositive: true,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      title: "Total Products",
      value: stats.totalProducts.toString(),
      change: "+5.1%",
      isPositive: true,
      icon: Package,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: 4,
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      change: "+3.8%",
      isPositive: true,
      icon: Users,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <AdminLayout>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pointer-events-none"></div>
      
      {/* Animated Blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="space-y-8 page-enter">
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 gradient-text">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's your business performance overview.</p>
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Metrics Grid - New Modern Design */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {kpiMetrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
                  {/* Gradient Border Top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${metric.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/50">
                        <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-600">{metric.change}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{loading ? "..." : metric.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart - Large */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <LineChart className="h-6 w-6 text-blue-600" />
                      Revenue Trend
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Last 30 days performance</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-80 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-slate-200/50 flex items-center justify-center group-hover:border-blue-200/50 transition-colors duration-300">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">Revenue Chart</p>
                    <p className="text-xs text-gray-500 mt-1">Interactive chart component</p>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Avg Daily</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(stats.totalRevenue / 30).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Peak Day</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(stats.totalRevenue * 0.15).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
              {/* Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="p-8 h-full flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-emerald-600" />
                    Quick Stats
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Key metrics</p>
                </div>

                <div className="space-y-4 flex-1">
                  {[
                    { label: "Conversion Rate", value: "3.24%", icon: Target, color: "text-blue-600" },
                    { label: "Avg Order Value", value: `₹${(stats.totalRevenue / Math.max(stats.totalOrders, 1)).toFixed(0)}`, icon: ShoppingCart, color: "text-purple-600" },
                    { label: "Customer LTV", value: `₹${(stats.totalRevenue / Math.max(stats.totalCustomers, 1)).toFixed(0)}`, icon: Users, color: "text-orange-600" },
                  ].map((stat, idx) => {
                    const StatIcon = stat.icon
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-100 transition-all duration-200 border border-slate-200/50 hover:border-slate-300/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-white ${stat.color}`}>
                            <StatIcon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{stat.value}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-200/50">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-200">
                    View Detailed Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tables & Widgets */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                      Recent Orders
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 text-blue-600">
                    View All
                  </Button>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 border border-slate-200/50 hover:border-blue-200/50 group/item cursor-pointer">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-700">#{1000 + i}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Order #{1000 + i}</p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{(i * 5000).toLocaleString()}</p>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/50">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Package className="h-6 w-6 text-purple-600" />
                      Top Products
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Best sellers</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 text-purple-600">
                    View All
                  </Button>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-purple-50 hover:to-pink-50 transition-all duration-200 border border-slate-200/50 hover:border-purple-200/50 group/item cursor-pointer">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Product {i}</p>
                          <p className="text-xs text-gray-500">{i * 150} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{(i * 2000).toLocaleString()}</p>
                        <div className="h-1 w-12 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mt-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: "600ms" }}>
          {[
            { title: "Conversion Rate", value: "3.24%", change: "+0.5%", icon: Target, color: "from-blue-500 to-cyan-600" },
            { title: "Avg Session", value: "4m 32s", change: "+12s", icon: Clock, color: "from-purple-500 to-pink-600" },
            { title: "Bounce Rate", value: "42.3%", change: "-2.1%", icon: AlertCircle, color: "from-orange-500 to-red-600" },
          ].map((metric, idx) => {
            const MetricIcon = metric.icon
            return (
              <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-2">{metric.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} bg-opacity-10`}>
                    <MetricIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
