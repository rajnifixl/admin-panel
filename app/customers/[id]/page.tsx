"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Package, Calendar, Mail, ShoppingBag, Clock, CreditCard, MapPin, RotateCcw, Star, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const statusStyles: Record<string, string> = {
  "Pending":      "bg-yellow-100 text-yellow-800",
  "Confirmed":    "bg-blue-100 text-blue-800",
  "Shipped":      "bg-purple-100 text-purple-800",
  "Delivered":    "bg-green-100 text-green-800",
  "Cancelled":    "bg-red-100 text-red-800",
  "Return Requested": "bg-orange-100 text-orange-800",
  "Returned":     "bg-pink-100 text-pink-800",
}

const paymentStatusStyles: Record<string, string> = {
  "true":  "bg-green-100 text-green-800",
  "false": "bg-yellow-100 text-yellow-800",
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [returnsLoading, setReturnsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  
  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all")
  const [orderPriceFilter, setOrderPriceFilter] = useState<string>("all")
  const [orderDateFilter, setOrderDateFilter] = useState<string>("all")

  const getToken = () => localStorage.getItem("adminToken") || ""

  const fetchCustomerData = async () => {
    setLoading(true)
    try {
      console.log("📥 Fetching customer ID:", customerId)
      
      // Call the new combined endpoint that returns both customer and orders
      const res = await fetch(`${BACKEND_URL}/api/user/customer/${customerId}`, {
        headers: { authorization: getToken() },
      })
      const data = await res.json()
      console.log("📥 API Response:", data)
      
      if (data.success) {
        setCustomer(data.customer)
        // Set orders from the combined response
        if (data.orders && data.orders.length > 0) {
          const sortedOrders = data.orders.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.date).getTime()
            const dateB = new Date(b.createdAt || b.date).getTime()
            return dateB - dateA
          })
          setOrders(sortedOrders)
        }
      } else {
        toast.error("Customer not found")
        router.push("/customers")
      }
    } catch (error) {
      console.error("❌ Error fetching customer:", error)
      toast.error("Failed to fetch customer details")
      router.push("/customers")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerOrders = async () => {
    // This function is now handled by fetchCustomerData
    // Keeping it for backward compatibility if needed
    setOrdersLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/order/user/${customerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        const sortedOrders = data.orders.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.date).getTime()
          const dateB = new Date(b.createdAt || b.date).getTime()
          return dateB - dateA
        })
        setOrders(sortedOrders)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to fetch orders")
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchCustomerReturns = async () => {
    setReturnsLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/returns/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        const userReturns = data.returns.filter((ret: any) => ret.userId._id === customerId)
        setReturns(userReturns)
      }
    } catch (error) {
      console.error("Error fetching returns:", error)
    } finally {
      setReturnsLoading(false)
    }
  }

  const fetchCustomerReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        const userReviews = data.reviews.filter((review: any) => review.userId._id === customerId)
        setReviews(userReviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchCustomerData()
      // fetchCustomerOrders() is now handled by fetchCustomerData
      fetchCustomerReturns()
      fetchCustomerReviews()
    }
  }, [customerId])

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatTime = (date: any) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getTotalOrderValue = (orderList: any[]) => {
    return orderList.reduce((sum, order) => sum + (order.amount || 0), 0)
  }

  // Filter orders based on selected filters
  const getFilteredOrders = () => {
    let filtered = [...orders]

    // Status filter
    if (orderStatusFilter !== "all") {
      filtered = filtered.filter(order => order.status === orderStatusFilter)
    }

    // Price filter
    if (orderPriceFilter !== "all") {
      if (orderPriceFilter === "under500") {
        filtered = filtered.filter(order => (order.amount || 0) < 500)
      } else if (orderPriceFilter === "500to1000") {
        filtered = filtered.filter(order => (order.amount || 0) >= 500 && (order.amount || 0) < 1000)
      } else if (orderPriceFilter === "1000to5000") {
        filtered = filtered.filter(order => (order.amount || 0) >= 1000 && (order.amount || 0) < 5000)
      } else if (orderPriceFilter === "above5000") {
        filtered = filtered.filter(order => (order.amount || 0) >= 5000)
      }
    }

    // Date filter
    if (orderDateFilter !== "all") {
      const now = new Date()
      const orderDate = new Date()
      
      if (orderDateFilter === "today") {
        orderDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(order => {
          const date = new Date(order.createdAt || order.date)
          date.setHours(0, 0, 0, 0)
          return date.getTime() === orderDate.getTime()
        })
      } else if (orderDateFilter === "week") {
        orderDate.setDate(orderDate.getDate() - 7)
        filtered = filtered.filter(order => new Date(order.createdAt || order.date) >= orderDate)
      } else if (orderDateFilter === "month") {
        orderDate.setMonth(orderDate.getMonth() - 1)
        filtered = filtered.filter(order => new Date(order.createdAt || order.date) >= orderDate)
      }
    }

    return filtered
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading customer details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Customer not found</p>
          <Link href="/customers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Details</h1>
            <p className="text-muted-foreground">View customer information and order history</p>
          </div>
        </div>

        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {customer.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-muted-foreground mt-1">{customer.email}</p>
                {customer.phone && (
                  <p className="text-muted-foreground">📱 {customer.phone}</p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Orders</span>
                </div>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-2xl font-bold">${getTotalOrderValue(orders).toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Returns</span>
                </div>
                <p className="text-2xl font-bold">{returns.length}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Joined</span>
                </div>
                <p className="text-sm font-semibold">
                  {customer.createdAt ? formatDate(customer.createdAt) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History ({getFilteredOrders().length} of {orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-2">
                    {/* Status Filter */}
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* Price Filter */}
                    <select
                      value={orderPriceFilter}
                      onChange={(e) => setOrderPriceFilter(e.target.value)}
                      className="px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <option value="all">All Prices</option>
                      <option value="under500">Under ₹500</option>
                      <option value="500to1000">₹500 - ₹1000</option>
                      <option value="1000to5000">₹1000 - ₹5000</option>
                      <option value="above5000">Above ₹5000</option>
                    </select>

                    {/* Date Filter */}
                    <select
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>

                  {/* Reset Filters Button */}
                  {(orderStatusFilter !== "all" || orderPriceFilter !== "all" || orderDateFilter !== "all") && (
                    <button
                      onClick={() => {
                        setOrderStatusFilter("all")
                        setOrderPriceFilter("all")
                        setOrderDateFilter("all")
                      }}
                      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Filtered Orders */}
                {getFilteredOrders().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders match the selected filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredOrders().map((order) => (
                  <div key={order._id} className="rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Order Header */}
                    <div className="bg-muted/30 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-mono text-primary font-semibold">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(order.createdAt || order.date)}</span>
                            <span className="text-xs">at {formatTime(order.createdAt || order.date)}</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ${statusStyles[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </Badge>
                      </div>

                      {/* Payment and Amount */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className={`text-xs ${paymentStatusStyles[order.payment?.toString() || "false"]}`}>
                            {order.payment ? "✓ Paid" : "⏳ Pending"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Amount</p>
                          <p className="text-sm font-bold text-primary">${order.amount?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 space-y-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Items ({order.items?.length || 0})</p>
                      <div className="space-y-2">
                        {order.items?.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex items-start gap-3 pb-2 border-b border-border last:border-0 last:pb-0">
                            {item.image && (
                              <img
                                src={Array.isArray(item.image) ? item.image[0] : item.image}
                                alt={item.name}
                                className="h-12 w-12 rounded object-cover bg-muted flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity}x @ ${item.price?.toFixed(2)}
                                </p>
                                <p className="text-xs font-semibold">
                                  ${(item.quantity * item.price)?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="bg-muted/20 p-4 space-y-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium">{order.paymentMethod || "COD"}</span>
                      </div>
                      {order.address && (
                        <div className="flex items-start gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="text-muted-foreground">
                            <p>{order.address.firstName} {order.address.lastName}</p>
                            <p>{order.address.street}, {order.address.city}</p>
                            <p>{order.address.state} - {order.address.zipcode}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Returns Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Return Requests ({returns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {returnsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading returns...
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No return requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {returns.map((ret: any) => (
                  <div key={ret._id} className="rounded-lg border border-border p-4 bg-muted/30 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{ret.productName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ret.reason}</p>
                      </div>
                      <Badge className={`text-xs ${statusStyles[ret.status] || "bg-gray-100 text-gray-700"}`}>
                        {ret.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                      <span className="text-muted-foreground">Quantity: {ret.quantity}</span>
                      <span className="font-semibold text-primary">${ret.refundAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div key={review._id} className="rounded-lg border border-border p-4 bg-muted/30 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{review.productName}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground italic mb-2">"{review.comment}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
