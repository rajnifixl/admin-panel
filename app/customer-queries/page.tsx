"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, RefreshCw, MessageSquare, Trash2, Eye, Reply, MessageCircle, Calendar, Mail, Phone } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  isLoggedIn,
  getCustomerQueries,
  deleteCustomerQuery,
  updateQueryStatus,
  getCustomerQueryStats,
  replyToCustomerQuery,
  updateCustomerQueryReply,
} from "@/lib/api"

interface Contact {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  adminReply?: string | null
  repliedAt?: string | null
  repliedBy?: string | null
  createdAt: string
}

interface QueryStats {
  total: number
  byStatus: {
    new: number
    read: number
    replied: number
    archived: number
  }
  last30Days: number
}

const statusColors = {
  new: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100', icon: '🔴' },
  read: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100', icon: '🟠' },
  replied: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100', icon: '🟢' },
  archived: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100', icon: '⚪' },
}

export default function CustomerQueriesPage() {
  const router = useRouter()
  const [queries, setQueries] = useState<Contact[]>([])
  const [stats, setStats] = useState<QueryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<Contact | null>(null)
  const [replyText, setReplyText] = useState("")
  const limit = 20

  const fetchQueries = async (statusParam?: string, pageParam: number = 1) => {
    setLoading(true)
    try {
      const filterStatus = statusParam && statusParam !== 'all' ? statusParam : undefined
      const data: any = await getCustomerQueries(filterStatus, pageParam, limit)

      if (data.success) {
        setQueries(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setPage(data.pagination?.page || 1)
      } else {
        toast.error(data.message || "Failed to fetch customer queries")
      }
    } catch (err: any) {
      console.error('❌ Fetch queries error:', err)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data: any = await getCustomerQueryStats()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    fetchQueries(statusFilter, page)
    fetchStats()
  }, [router])

  const handleStatusChange = async (queryId: string, newStatus: string) => {
    setActionLoading(queryId)
    try {
      const data: any = await updateQueryStatus(queryId, newStatus)
      if (data.success) {
        setQueries(queries.map(q => q._id === queryId ? { ...q, status: newStatus as any } : q))
        toast.success("Status updated successfully")
        fetchStats()
      } else {
        toast.error(data.message || "Failed to update status")
      }
    } catch (err: any) {
      toast.error("Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return
    }

    setActionLoading(queryId)
    try {
      const data: any = await deleteCustomerQuery(queryId)
      if (data.success) {
        setQueries(queries.filter(q => q._id !== queryId))
        toast.success("Query deleted successfully")
        fetchStats()
      } else {
        toast.error(data.message || "Failed to delete query")
      }
    } catch (err: any) {
      toast.error("Failed to delete query")
    } finally {
      setActionLoading(null)
    }
  }

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1)
    fetchQueries(newStatus, 1)
  }

  const openReplyModal = (query: Contact) => {
    setSelectedQuery(query)
    setReplyText(query.adminReply || "")
    setReplyModalOpen(true)
  }

  const handleSaveReply = async () => {
    if (!selectedQuery) return
    const trimmedReply = replyText.trim()

    if (!trimmedReply) {
      toast.error("Please enter a reply message")
      return
    }

    setActionLoading(selectedQuery._id)
    try {
      const apiCall = selectedQuery.adminReply
        ? updateCustomerQueryReply(selectedQuery._id, trimmedReply)
        : replyToCustomerQuery(selectedQuery._id, trimmedReply)

      const data: any = await apiCall
      if (data.success) {
        const updated = data.data
        setQueries((prev) =>
          prev.map((q) => (q._id === selectedQuery._id ? { ...q, ...updated } : q))
        )
        setReplyModalOpen(false)
        setSelectedQuery(null)
        setReplyText("")
        toast.success("Reply saved successfully")
        fetchStats()
      } else {
        toast.error(data.message || "Failed to save reply")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save reply")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = queries.filter(q => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      q.name?.toLowerCase().includes(query) ||
      q.email?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query)
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Customer Queries</h1>
            <p className="text-gray-600 mt-1">Manage customer contact form submissions</p>
          </div>
          <Button onClick={() => fetchQueries(statusFilter, page)} variant="outline" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-blue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Total Queries</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">New</div>
                    <div className="text-3xl font-bold text-red-600 mt-2">{stats.byStatus.new}</div>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <MessageCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Read</div>
                    <div className="text-3xl font-bold text-amber-600 mt-2">{stats.byStatus.read}</div>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Eye className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-emerald">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Replied</div>
                    <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.byStatus.replied}</div>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Reply className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-purple">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Last 30 Days</div>
                    <div className="text-3xl font-bold text-purple-600 mt-2">{stats.last30Days}</div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  placeholder="Search by name, email, subject..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <CardTitle className="text-lg font-semibold text-gray-900">All Queries</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Loading queries...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No queries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 bg-gray-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden md:table-cell">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden lg:table-cell">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden sm:table-cell">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filtered.map((query, idx) => (
                      <tr key={query._id} className={`hover:bg-gray-50/50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-600">
                              <AvatarFallback className="text-white font-semibold text-sm">
                                {query.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{query.name}</p>
                              {query.phone && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">{query.phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {query.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm hidden lg:table-cell">
                          <div className="max-w-xs truncate text-gray-700 font-medium">{query.subject}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={query.status}
                            onChange={(e) => handleStatusChange(query._id, e.target.value)}
                            disabled={actionLoading === query._id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer transition-all duration-200 ${statusColors[query.status].badge} ${statusColors[query.status].text} disabled:opacity-50 hover:shadow-md`}
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date(query.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                toast.success(`"${query.subject}": ${query.message.substring(0, 100)}...`, {
                                  duration: 5
                                })
                              }}
                              title="View message"
                              disabled={actionLoading === query._id}
                              className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openReplyModal(query)}
                              title={query.adminReply ? "Edit reply" : "Reply"}
                              disabled={actionLoading === query._id}
                              className="h-8 w-8 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(query._id)}
                              title="Delete"
                              disabled={actionLoading === query._id}
                              className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{queries.length}</span> queries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1)
                      fetchQueries(statusFilter, page - 1)
                    }
                  }}
                  disabled={page === 1 || loading}
                  className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm text-gray-600 font-medium">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (page < totalPages) {
                      setPage(page + 1)
                      fetchQueries(statusFilter, page + 1)
                    }
                  }}
                  disabled={page === totalPages || loading}
                  className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Reply to Customer Query</DialogTitle>
              <DialogDescription className="text-gray-600">
                Send a response to the customer. Saving this reply will mark the query as replied.
              </DialogDescription>
            </DialogHeader>

            {selectedQuery && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{selectedQuery.subject}</p>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{selectedQuery.message}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Admin Reply</label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply message..."
                    rows={6}
                    maxLength={5000}
                    className="rounded-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    {replyText.length}/5000 characters
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyModalOpen(false)}
                disabled={!!actionLoading}
                className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReply}
                disabled={!selectedQuery || actionLoading === selectedQuery?._id}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {selectedQuery?.adminReply ? "Update Reply" : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
