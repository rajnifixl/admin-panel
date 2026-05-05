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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const statusStyles: Record<string, string> = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "Approved": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
}

const reasonOptions = [
  "Defective",
  "Wrong Item",
  "Not as Described",
  "Changed Mind",
  "Other",
]

export default function ReturnsPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showDialog, setShowDialog] = useState(false)

  // Fetch all returns
  const fetchReturns = async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching returns...')
      const data = await authFetch('/api/admin/returns/list')
      console.log('📡 Returns response:', data)
      
      if (data.success) {
        setReturns(data.returns)
      } else {
        toast.error(data.message || "Failed to fetch returns")
      }
    } catch (err: any) {
      console.error('❌ Returns fetch error:', err.message)
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
    fetchReturns()
  }, [router])

  // Approve return
  const handleApprove = async () => {
    if (!selectedReturn) return

    setProcessingId(selectedReturn._id)
    try {
      const data = await authFetch(`/api/admin/returns/${selectedReturn._id}/approve`, {
        method: 'POST',
      })
      console.log('Approve return response:', data)
      
      if (data.success) {
        toast.success("Return approved! Stock restored.")
        setReturns(prev =>
          prev.map(r => r._id === selectedReturn._id ? { ...r, status: "Approved" } : r)
        )
        setShowDialog(false)
        setSelectedReturn(null)
      } else {
        toast.error(data.message || "Failed to approve return")
      }
    } catch (err: any) {
      console.error('❌ Approve return error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setProcessingId(null)
    }
  }

  // Reject return
  const handleReject = async () => {
    if (!selectedReturn) return

    setProcessingId(selectedReturn._id)
    try {
      const data = await authFetch(`/api/admin/returns/${selectedReturn._id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason }),
      })
      console.log('Reject return response:', data)
      
      if (data.success) {
        toast.success("Return rejected")
        setReturns(prev =>
          prev.map(r => r._id === selectedReturn._id ? { ...r, status: "Rejected" } : r)
        )
        setShowDialog(false)
        setSelectedReturn(null)
        setRejectionReason("")
      } else {
        toast.error(data.message || "Failed to reject return")
      }
    } catch (err: any) {
      console.error('❌ Reject return error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setProcessingId(null)
    }
  }

  // Filter returns
  const filtered = returns.filter(ret => {
    const search = searchQuery.toLowerCase()
    const matchSearch =
      ret._id?.toLowerCase().includes(search) ||
      ret.productName?.toLowerCase().includes(search) ||
      ret.userId?.name?.toLowerCase().includes(search) ||
      ret.reason?.toLowerCase().includes(search)

    const matchStatus = statusFilter === "all" || ret.status === statusFilter

    return matchSearch && matchStatus
  })

  // Stats
  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === "Pending").length,
    approved: returns.filter(r => r.status === "Approved").length,
    rejected: returns.filter(r => r.status === "Rejected").length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Return Requests</h1>
            <p className="text-muted-foreground">Manage product return requests</p>
          </div>
          <Button onClick={fetchReturns} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, user, reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return Requests ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading returns...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">No return requests found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Product</th>
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Reason</th>
                      <th className="text-left py-3 px-4 font-medium">Qty</th>
                      <th className="text-left py-3 px-4 font-medium">Refund</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ret) => (
                      <tr key={ret._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{ret.productName}</td>
                        <td className="py-3 px-4">{ret.userId?.name || "Unknown"}</td>
                        <td className="py-3 px-4">{ret.reason}</td>
                        <td className="py-3 px-4">{ret.quantity}</td>
                        <td className="py-3 px-4 font-medium">${ret.refundAmount?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusStyles[ret.status]}>
                            {ret.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => router.push(`/returns/${ret._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ret.status === "Pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => {
                                    setSelectedReturn(ret)
                                    setActionType("approve")
                                    setShowDialog(true)
                                  }}
                                  disabled={processingId === ret._id}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedReturn(ret)
                                    setActionType("reject")
                                    setShowDialog(true)
                                  }}
                                  disabled={processingId === ret._id}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {ret.status === "Approved" ? "✓ Processed" : "✗ Rejected"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Return Request?" : "Reject Return Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" ? (
                <div className="space-y-2">
                  <p>Product: <strong>{selectedReturn?.productName}</strong></p>
                  <p>Quantity: <strong>{selectedReturn?.quantity}</strong></p>
                  <p>Refund Amount: <strong>${selectedReturn?.refundAmount?.toFixed(2)}</strong></p>
                  <p className="text-sm text-yellow-600 mt-4">
                    ✓ Stock will be restored automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p>Product: <strong>{selectedReturn?.productName}</strong></p>
                    <p>Reason: <strong>{selectedReturn?.reason}</strong></p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rejection Reason (optional)</label>
                    <Input
                      placeholder="Why are you rejecting this return?"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionType === "approve") {
                  handleApprove()
                } else {
                  handleReject()
                }
              }}
              disabled={processingId !== null}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processingId ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
