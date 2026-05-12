"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { RefreshCw } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function TrafficChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getToken = () => localStorage.getItem("adminToken") || ""

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND_URL}/api/order/list`, {
          headers: { authorization: getToken() },
        })
        const result = await res.json()
        if (result.success) {
          const now = new Date()
          // Last 7 days orders count
          const weekly = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now)
            d.setDate(now.getDate() - (6 - i))
            const dayOrders = result.orders.filter((o: any) => {
              const od = new Date(o.date)
              return od.toDateString() === d.toDateString()
            })
            return {
              day: DAYS[d.getDay()],
              orders: dayOrders.length,
              revenue: dayOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
            }
          })
          setData(weekly)
        }
      } catch (err) {
        console.error("Traffic chart error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Weekly Orders (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "orders" ? `${value} orders` : `$${value.toFixed(2)}`,
                    name === "orders" ? "Orders" : "Revenue"
                  ]}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                />
                <Bar dataKey="orders" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}