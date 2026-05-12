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
  'Shipped': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered': ['Return Requested'],
  'Cancelled': [],
  'Return Requested': ['Returned'],
  'Returned': [],
}

const statusStyles: Record<string, string> = {
  "Pending":          "bg-yellow-100 text-yellow-800",
  "Confirmed":        "bg-blue-100 text-blue-800",
  "Shipped":          "bg-purple-100 text-purple-800",
  "Out for Delivery": "bg-indigo-100 text-indigo-800",
  "Delivered":        "bg-green-100 text-green-800",
  "Cancelled":        "bg-red-100 text-red-800",
  "Return Requested": "bg-orange-100 text-orange-800",
  "Returned":         "bg-gray-100 text-gray-800",
}

const statusOptions = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
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
      <div className="space-y-6 page-enter">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage and track all customer orders</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" className="w-full sm:w-auto btn-premium">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
                </div>
                <Package className="h-12 w-12 text-blue-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-orange">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending / Packing</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pending}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-orange-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-purple">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Shipped</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{shipped}</p>
                </div>
                <Package className="h-12 w-12 text-purple-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-emerald">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Delivered</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{delivered}</p>
                </div>
                <Package className="h-12 w-12 text-emerald-500/20" />
              </div>
            </CardContent>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="card-premium">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-bold text-gray-900">
                All Orders
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (Revenue: <span className="text-emerald-600 font-semibold">${totalRevenue.toFixed(2)}</span>)
                </span>
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64 input-premium"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 input-premium">
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
              <div className="flex items-center justify-center py-20 text-gray-500">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Loading orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Package className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th className="hidden md:table-cell">Items</th>
                      <th className="hidden lg:table-cell">Date</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order._id} className="hover-lift cursor-pointer" onClick={() => router.push(`/orders/${order._id}`)}>
                        <td>
                          <span className="text-xs font-mono text-blue-600 hover:underline font-semibold">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <p className="text-sm font-semibold text-gray-900">
                            {order.address?.firstName} {order.address?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{order.address?.email}</p>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="text-xs text-gray-600 max-w-[200px]">
                            {order.items?.map((item: any, i: number) => (
                              <span key={i}>
                                {item.name} x{item.quantity}
                                {i < order.items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-xs text-gray-600 hidden lg:table-cell">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="text-sm font-bold text-gray-900">
                          ${order.amount?.toFixed(2)}
                        </td>
                        <td>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {order.paymentMethod || "COD"}
                          </Badge>
                        </td>
                        <td>
                          <Select
                            value={order.status}
                            onValueChange={val => updateStatus(order._id, val)}
                            disabled={updatingId === order._id}
                          >
                            <SelectTrigger className="h-8 w-44 text-xs input-premium">
                              <SelectValue>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[order.status] || "bg-gray-100 text-gray-700"}`}>
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

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/50">
              <p className="text-sm text-gray-600 font-medium">
                Showing <span className="font-bold text-gray-900">{filtered.length}</span> of <span className="font-bold text-gray-900">{orders.length}</span> orders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}