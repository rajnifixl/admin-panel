"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const statusStyles: Record<string, string> = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Approved": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
}

export default function ReturnDetailPage() {
  const router = useRouter()
  const params = useParams()
  const returnId = params.id as string

  const [returnData, setReturnData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getToken = () => localStorage.getItem("adminToken") || ""

  // Fetch return details
  useEffect(() => {
    const fetchReturnDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("Fetching return details for ID:", returnId)
        const res = await fetch(`${BACKEND_URL}/api/admin/returns/${returnId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        const data = await res.json()
        console.log("Return details response:", data)

        if (data.success) {
          setReturnData(data.return)
        } else {
          setError(data.message || "Failed to fetch return details")
          toast.error(data.message || "Failed to fetch return details")
        }
      } catch (err) {
        console.error("Error fetching return details:", err)
        setError("Cannot connect to backend")
        toast.error("Cannot connect to backend")
      } finally {
        setLoading(false)
      }
    }

    if (returnId) {
      fetchReturnDetails()
    }
  }, [returnId])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading return details...</div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !returnData) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/returns")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Returns
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Return</h3>
                  <p className="text-sm text-red-800 mt-1">{error || "Return not found"}</p>
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/returns")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Returns
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Return Details</h1>
            <p className="text-muted-foreground">Return ID: {returnData._id}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Return Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Return Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Return Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusStyles[returnData.status]}>
                    {returnData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Return ID:</span>
                  <span className="font-mono text-sm">{returnData._id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-sm">{returnData.orderId?._id || "N/A"}</span>
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
                  <span className="font-medium">{returnData.userId?.name || "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{returnData.userId?.email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-sm">{returnData.userId?.phone || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image */}
                {returnData.productId?.image && (
                  <div className="mb-4">
                    <img 
                      src={returnData.productId.image} 
                      alt={returnData.productName}
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Product Name:</span>
                  <span className="font-medium">{returnData.productName}</span>
                </div>
                {returnData.productId?.price && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Product Price:</span>
                    <span className="font-medium">₹{returnData.productId.price?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{returnData.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Refund Amount:</span>
                  <span className="font-bold text-green-600">₹{returnData.refundAmount?.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Return Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Return Reason</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground block mb-2">Reason:</span>
                  <Badge variant="outline">{returnData.reason}</Badge>
                </div>
                {returnData.description && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Description:</span>
                    <p className="text-sm bg-muted p-3 rounded-md">{returnData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection Reason (if rejected) */}
            {returnData.status === "Rejected" && returnData.rejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-800">{returnData.rejectionReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Timeline & Dates */}
          <div className="space-y-6">
            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Request Date */}
                <div className="border-l-2 border-blue-500 pl-4 pb-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase">Requested</div>
                  <div className="text-sm font-medium mt-1">
                    {formatDate(returnData.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(returnData.createdAt)}
                  </div>
                </div>

                {/* Approved Date */}
                {returnData.approvedAt && (
                  <div className="border-l-2 border-green-500 pl-4 pb-4">
                    <div className="text-xs font-semibold text-green-600 uppercase">Approved</div>
                    <div className="text-sm font-medium mt-1">
                      {formatDate(returnData.approvedAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(returnData.approvedAt)}
                    </div>
                  </div>
                )}

                {/* Rejected Date */}
                {returnData.rejectedAt && (
                  <div className="border-l-2 border-red-500 pl-4">
                    <div className="text-xs font-semibold text-red-600 uppercase">Rejected</div>
                    <div className="text-sm font-medium mt-1">
                      {formatDate(returnData.rejectedAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(returnData.rejectedAt)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="font-semibold mt-1">{returnData.status}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Refund:</span>
                  <div className="font-bold text-green-600 mt-1">₹{returnData.refundAmount?.toFixed(2)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <div className="font-semibold mt-1">{returnData.quantity} unit(s)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
