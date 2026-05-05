"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, Package } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const statusStyles: Record<string, string> = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Confirmed": "bg-blue-100 text-blue-800",
  "Shipped": "bg-purple-100 text-purple-800",
  "Delivered": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
  "Return Requested": "bg-orange-100 text-orange-800",
  "Returned": "bg-indigo-100 text-indigo-800",
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getToken = () => localStorage.getItem("adminToken") || ""

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("Fetching order details for ID:", orderId)
        const res = await fetch(`${BACKEND_URL}/api/order/${orderId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        const data = await res.json()
        console.log("Order details response:", data)

        if (data.success) {
          setOrderData(data.order)
        } else {
          setError(data.message || "Failed to fetch order details")
          toast.error(data.message || "Failed to fetch order details")
        }
      } catch (err) {
        console.error("Error fetching order details:", err)
        setError("Cannot connect to backend")
        toast.error("Cannot connect to backend")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading order details...</div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !orderData) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/orders")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Order</h3>
                  <p className="text-sm text-red-800 mt-1">{error || "Order not found"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const totalItems = orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order ID: {orderData._id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Order Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusStyles[orderData.status]}>
                    {orderData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-sm">{orderData._id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <Badge variant="outline">{orderData.paymentMethod || "COD"}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{orderData.userId?.name || "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{orderData.userId?.email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-sm">{orderData.userId?.phone || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">
                  {orderData.address?.firstName} {orderData.address?.lastName}
                </p>
                <p className="text-muted-foreground">{orderData.address?.street}</p>
                <p className="text-muted-foreground">
                  {orderData.address?.city}, {orderData.address?.state} {orderData.address?.zipcode}
                </p>
                <p className="text-muted-foreground">{orderData.address?.country}</p>
                <p className="text-muted-foreground">{orderData.address?.phone}</p>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({totalItems})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items && orderData.items.length > 0 ? (
                    orderData.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                        {/* Product Image */}
                        {item.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg border border-border"
                            />
                          </div>
                        )}
                        {/* Product Details */}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.size && (
                            <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                          )}
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          <p className="text-sm font-semibold mt-2">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        {/* Unit Price */}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Unit Price</p>
                          <p className="font-medium">${item.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mr-2 opacity-50" />
                      <span>No items in this order</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Dates */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${orderData.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${orderData.amount?.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground">Payment Status:</span>
                  <div className="mt-1">
                    <Badge variant={orderData.payment ? "default" : "secondary"}>
                      {orderData.payment ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Date */}
                <div className="border-l-2 border-blue-500 pl-4 pb-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase">Ordered</div>
                  <div className="text-sm font-medium mt-1">
                    {formatDate(orderData.date || orderData.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(orderData.date || orderData.createdAt)}
                  </div>
                </div>

                {/* Delivered Date */}
                {orderData.deliveredDate && (
                  <div className="border-l-2 border-green-500 pl-4">
                    <div className="text-xs font-semibold text-green-600 uppercase">Delivered</div>
                    <div className="text-sm font-medium mt-1">
                      {formatDate(orderData.deliveredDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(orderData.deliveredDate)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Items:</span>
                  <div className="font-semibold mt-1">{totalItems} item(s)</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Order Status:</span>
                  <div className="font-semibold mt-1">{orderData.status}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <div className="font-semibold mt-1">{orderData.paymentMethod || "COD"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
