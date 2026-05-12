"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const COLORS = [
  "var(--color-chart-1, #3b82f6)",
  "var(--color-chart-2, #10b981)",
  "var(--color-chart-3, #f59e0b)",
  "var(--color-chart-4, #8b5cf6)",
]

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getToken = () => localStorage.getItem("adminToken") || ""

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/order/list`, {
        headers: { authorization: getToken() },
      })
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error("Failed to fetch data")
      }
    } catch {
      toast.error("Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  // ── Revenue by Month (last 6 months) ──
  const revenueByMonth = (() => {
    const now = new Date()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const monthOrders = orders.filter(o => {
        const od = new Date(o.date)
        return od.getMonth() === month && od.getFullYear() === year
      })
      result.push({
        month: MONTHS[month],
        sales: monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        orders: monthOrders.length,
      })
    }
    return result
  })()

  // ── Orders by Category ──
  const ordersByCategory = (() => {
    const map: Record<string, number> = {}
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        const cat = item.category || "Other"
        map[cat] = (map[cat] || 0) + 1
      })
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })()

  // ── Orders by Status ──
  const ordersByStatus = (() => {
    const map: Record<string, number> = {}
    orders.forEach(o => {
      const s = o.status || "Unknown"
      map[s] = (map[s] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })()

  // ── Daily orders (last 7 days) ──
  const dailyOrders = (() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const dayOrders = orders.filter(o => {
        const od = new Date(o.date)
        return od.toDateString() === d.toDateString()
      })
      return {
        day: days[d.getDay()],
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      }
    })
  })()

  // ── Stats ──
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length
  const pendingOrders = orders.filter(o => ["Order Placed","Pending","Packing"].includes(o.status)).length
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  return (
    <AdminLayout>
      <div className="space-y-8 page-enter">

        {/* Header with Gradient Text */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text">Analytics</h1>
            <p className="text-muted-foreground mt-2">Real-time insights from your store data</p>
          </div>
          <Button 
            onClick={fetchOrders} 
            className="btn-gradient w-fit"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Key Metrics — REAL */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue - Blue */}
          <Card className="stat-card stat-card-blue border-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium text-slate-600">Total Revenue</div>
                <div className="text-3xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-blue-600 font-medium">Live from DB ✓</div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders - Emerald */}
          <Card className="stat-card stat-card-emerald border-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium text-slate-600">Total Orders</div>
                <div className="text-3xl font-bold text-slate-900">{orders.length}</div>
                <div className="text-xs text-emerald-600 font-medium">Live from DB ✓</div>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Orders - Orange */}
          <Card className="stat-card stat-card-orange border-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium text-slate-600">Delivered Orders</div>
                <div className="text-3xl font-bold text-slate-900">{deliveredOrders}</div>
                <div className="text-xs text-orange-600 font-medium">Pending: {pendingOrders}</div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Order Value - Purple */}
          <Card className="stat-card stat-card-purple border-0">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium text-slate-600">Avg. Order Value</div>
                <div className="text-3xl font-bold text-slate-900">${avgOrderValue.toFixed(2)}</div>
                <div className="text-xs text-purple-600 font-medium">Live from DB ✓</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Orders Trend — REAL */}
        <Card className="card-premium border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Revenue & Orders Trend</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Last 6 months performance</p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Orders + Category */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Daily Orders — REAL */}
          <Card className="card-premium border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Daily Orders</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Last 7 days activity</p>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders by Status — REAL */}
          <Card className="card-premium border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Orders by Status</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Distribution across statuses</p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} dataKey="value">
                      {ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {ordersByStatus.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders by Category — REAL */}
        {ordersByCategory.length > 0 && (
          <Card className="card-premium border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Orders by Category</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Product category breakdown</p>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AdminLayout>
  )
}
