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
  "var(--color-chart-1, #6366f1)",
  "var(--color-chart-2, #22c55e)",
  "var(--color-chart-3, #f59e0b)",
  "var(--color-chart-4, #ef4444)",
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
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Real-time insights from your store data</p>
          </div>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics — REAL */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-green-500">Live from DB ✓</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-xs text-green-500">Live from DB ✓</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Delivered</div>
              <div className="text-2xl font-bold text-green-600">{deliveredOrders}</div>
              <div className="text-xs text-muted-foreground">Pending: {pendingOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Avg. Order Value</div>
              <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
              <div className="text-xs text-green-500">Live from DB ✓</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Orders Trend — REAL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue & Orders Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Orders + Category */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Daily Orders — REAL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Daily Orders (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyOrders}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders by Status — REAL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
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
              <div className="mt-4 grid grid-cols-2 gap-2">
                {ordersByStatus.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                    <span className="ml-auto text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders by Category — REAL */}
        {ordersByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Orders by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByCategory} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
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