"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { authFetch } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const statusStyles: Record<string, string> = {
  "Order Placed": "bg-yellow-100 text-yellow-800",
  "Pending":      "bg-yellow-100 text-yellow-800",
  "Packing":      "bg-blue-100 text-blue-800",
  "Processing":   "bg-blue-100 text-blue-800",
  "Shipped":      "bg-purple-100 text-purple-800",
  "Out for Delivery": "bg-orange-100 text-orange-800",
  "Delivered":    "bg-green-100 text-green-800",
  "Cancelled":    "bg-red-100 text-red-800",
}

export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      console.log('📡 RecentOrders - Fetching orders...')
      const data = await authFetch('/api/order/list')
      console.log('📡 RecentOrders - Response:', data)
      
      if (data.success) {
        setOrders(data.orders.slice(0, 5))
      }
    } catch (err: any) {
      console.error("❌ Recent orders error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    console.log('📡 RecentOrders - Mounted, fetching...')
    fetchOrders() 
  }, [])

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const name = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim()
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                  return (
                    <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium font-mono">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {initials || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:block">
                            <p className="text-sm font-medium">{name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{order.address?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[180px] truncate">
                        {order.items?.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ${order.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={statusStyles[order.status] || "bg-gray-100 text-gray-700"}
                        >
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}