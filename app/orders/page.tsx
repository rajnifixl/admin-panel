"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, RefreshCw, Package, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

// Define valid status transitions (must match backend)
const STATUS_FLOW = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered'],
  'Delivered': [],
  'Cancelled': [],
  'Return Requested': [],
  'Returned': [],
}

const statusStyles: Record<string, string> = {
  "Pending":      "bg-yellow-100 text-yellow-800",
  "Confirmed":    "bg-blue-100 text-blue-800",
  "Shipped":      "bg-purple-100 text-purple-800",
  "Delivered":    "bg-green-100 text-green-800",
  "Cancelled":    "bg-red-100 text-red-800",
}

const statusOptions = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching orders...')
      const data = await authFetch('/api/order/list')
      console.log('📡 Orders response:', data)
      
      if (data.success) {
        setOrders(data.orders)
      } else {
        toast.error("Failed to fetch orders")
      }
    } catch (err: any) {
      console.error('❌ Fetch orders error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    fetchOrders()
  }, [router])

  // Update order status
  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    try {
      const data = await authFetch('/api/order/status', {
        method: 'PUT',
        body: JSON.stringify({ orderId, status }),
      })
      
      if (data.success) {
        toast.success("Status updated!")
        setOrders(prev =>
          prev.map(o => o._id === orderId ? { ...o, status } : o)
        )
      } else {
        toast.error(data.message || "Failed to update status")
      }
    } catch (err: any) {
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter orders
  const filtered = orders.filter(order => {
    const search = searchQuery.toLowerCase()
    const matchSearch =
      order._id?.toLowerCase().includes(search) ||
      order.address?.firstName?.toLowerCase().includes(search) ||
      order.address?.lastName?.toLowerCase().includes(search) ||
      order.address?.email?.toLowerCase().includes(search) ||
      order.items?.some((i: any) => i.name?.toLowerCase().includes(search))
    const matchStatus = statusFilter === "all" || order.status === statusFilter
    return matchSearch && matchStatus
  })

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const pending   = orders.filter(o => ["Pending", "Confirmed"].includes(o.status)).length
  const shipped   = orders.filter(o => o.status === "Shipped").length
  const delivered = orders.filter(o => o.status === "Delivered").length

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage and track all customer orders</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Pending / Packing</div>
              <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Shipped</div>
              <div className="text-2xl font-bold text-purple-600">{shipped}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Delivered</div>
              <div className="text-2xl font-bold text-green-600">{delivered}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">
                All Orders
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Total Revenue: ${totalRevenue.toFixed(2)})
                </span>
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Loading orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(order => (
                      <tr key={order._id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order._id}`)}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-primary hover:underline">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">
                            {order.address?.firstName} {order.address?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.address?.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-xs text-muted-foreground max-w-[200px]">
                            {order.items?.map((item: any, i: number) => (
                              <span key={i}>
                                {item.name} x{item.quantity}
                                {i < order.items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          ${order.amount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {order.paymentMethod || "COD"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={order.status}
                            onValueChange={val => updateStatus(order._id, val)}
                            disabled={updatingId === order._id}
                          >
                            <SelectTrigger className="h-8 w-44 text-xs">
                              <SelectValue>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status] || "bg-gray-100 text-gray-700"}`}>
                                  {order.status}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(s => {
                                const isAllowed = STATUS_FLOW[order.status as keyof typeof STATUS_FLOW]?.includes(s) || false
                                return (
                                  <SelectItem 
                                    key={s} 
                                    value={s} 
                                    className="text-xs"
                                    disabled={!isAllowed}
                                  >
                                    {s}
                                    {!isAllowed && ' (Not allowed)'}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {orders.length} orders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}