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
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, Eye, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

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
      <div className="space-y-8 page-enter">
        {/* Header Section */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Return Requests</h1>
            <p className="text-gray-600 mt-2">Manage and process product return requests</p>
          </div>
          <Button 
            onClick={fetchReturns} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-fit"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Returns Card */}
          <Card className="stat-card stat-card-blue shadow-sm hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Returns</p>
                  <p className="text-3xl font-bold text-gray-900 mb-3">{stats.total}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-blue-600">All time</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Returns Card */}
          <Card className="stat-card stat-card-orange shadow-sm hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Pending Returns</p>
                  <p className="text-3xl font-bold text-amber-600 mb-3">{stats.pending}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-600">Awaiting action</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-100 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved Returns Card */}
          <Card className="stat-card stat-card-emerald shadow-sm hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Approved Returns</p>
                  <p className="text-3xl font-bold text-emerald-600 mb-3">{stats.approved}</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">Processed</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected Returns Card */}
          <Card className="stat-card shadow-sm hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Rejected Returns</p>
                  <p className="text-3xl font-bold text-red-600 mb-3">{stats.rejected}</p>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-600">Declined</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-100 group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  placeholder="Search by product, user, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors duration-200 rounded-lg">
                  <Filter className="mr-2 h-4 w-4" />
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
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Return Requests ({filtered.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading returns...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium">No return requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 bg-gray-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden md:table-cell">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Reason</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden sm:table-cell">Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden lg:table-cell">Refund</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden sm:table-cell">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filtered.map((ret, idx) => (
                      <tr 
                        key={ret._id} 
                        className={`hover:bg-gray-50/50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 shadow-sm flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{ret.productName}</p>
                              <p className="text-xs text-gray-500">ID: {ret._id?.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm font-medium text-gray-900">{ret.userId?.name || "Unknown"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{ret.reason}</p>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell text-sm font-medium text-gray-900">{ret.quantity}</td>
                        <td className="px-6 py-4 hidden lg:table-cell text-sm font-semibold text-gray-900">₹{ret.refundAmount?.toFixed(2)}</td>
                        <td className="px-6 py-4 hidden sm:table-cell text-xs text-gray-500">
                          {new Date(ret.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {ret.status === "Pending" && (
                            <Badge className="badge-warning rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {ret.status === "Approved" && (
                            <Badge className="badge-success rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {ret.status === "Rejected" && (
                            <Badge className="badge-danger rounded-full">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border-gray-200"
                              onClick={() => router.push(`/returns/${ret._id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ret.status === "Pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200 border-gray-200"
                                  onClick={() => {
                                    setSelectedReturn(ret)
                                    setActionType("approve")
                                    setShowDialog(true)
                                  }}
                                  disabled={processingId === ret._id}
                                  title="Approve Return"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 border-gray-200"
                                  onClick={() => {
                                    setSelectedReturn(ret)
                                    setActionType("reject")
                                    setShowDialog(true)
                                  }}
                                  disabled={processingId === ret._id}
                                  title="Reject Return"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                {ret.status === "Approved" ? "✓ Processed" : "✗ Declined"}
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <p className="text-sm text-gray-600">Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{returns.length}</span> returns</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-100 transition-colors duration-200">Previous</Button>
                <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-100 transition-colors duration-200">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {actionType === "approve" ? "Approve Return Request?" : "Reject Return Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 mt-4">
              {actionType === "approve" ? (
                <div className="space-y-3 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Product</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedReturn?.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Quantity</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedReturn?.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Refund Amount</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">₹{selectedReturn?.refundAmount?.toFixed(2)}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">
                      ✓ Stock will be restored automatically
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Product</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedReturn?.productName}</p>
                    <p className="text-xs font-semibold text-gray-600 uppercase mt-3">Reason</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedReturn?.reason}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Rejection Reason (optional)</label>
                    <Input
                      placeholder="Why are you rejecting this return?"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2 bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-500"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-100 transition-colors duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionType === "approve") {
                  handleApprove()
                } else {
                  handleReject()
                }
              }}
              disabled={processingId !== null}
              className={`${
                actionType === "approve" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-red-600 hover:bg-red-700"
              } text-white transition-all duration-200 disabled:opacity-70`}
            >
              {processingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                actionType === "approve" ? "Approve Return" : "Reject Return"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
