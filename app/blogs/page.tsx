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
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, RefreshCw, Loader2, FileText, Calendar, User, Eye as EyeIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function BlogsPage() {
  const router = useRouter()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/admin/all`, {
        headers: { token }
      })
      const data = await response.json()
      if (data.success) {
        setBlogs(data.blogs)
      } else {
        toast.error("Failed to fetch blogs")
      }
    } catch (error) {
      console.error("Error fetching blogs:", error)
      toast.error("Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/publish/${id}`, {
        method: "PUT",
        headers: { token }
      })
      const data = await response.json()
      if (data.success) {
        setBlogs(blogs.map(blog => 
          blog._id === id ? { ...blog, isPublished: data.blog.isPublished } : blog
        ))
        toast.success(data.message)
      } else {
        toast.error("Failed to update blog")
      }
    } catch (error) {
      console.error("Error toggling publish:", error)
      toast.error("Failed to update blog")
    }
  }

  const handleDelete = async () => {
    if (!selectedBlog) return
    setDeleting(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/delete/${selectedBlog._id}`, {
        method: "DELETE",
        headers: { token }
      })
      const data = await response.json()
      if (data.success) {
        setBlogs(blogs.filter(blog => blog._id !== selectedBlog._id))
        toast.success("Blog deleted successfully")
        setShowDeleteModal(false)
        setSelectedBlog(null)
      } else {
        toast.error("Failed to delete blog")
      }
    } catch (error) {
      console.error("Error deleting blog:", error)
      toast.error("Failed to delete blog")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  // Filter blogs
  let filtered = blogs.filter(blog => {
    const matchSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       blog.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = categoryFilter === "all" || 
                         (typeof blog.category === 'object' ? blog.category?.name : blog.category) === categoryFilter
    const matchStatus = statusFilter === "all" || 
                       (statusFilter === "published" ? blog.isPublished : !blog.isPublished)
    return matchSearch && matchCategory && matchStatus
  })

  const categories = Array.from(new Set(blogs.map(b => typeof b.category === 'object' ? b.category?.name : b.category)))
  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.isPublished).length,
    draft: blogs.filter(b => !b.isPublished).length,
    totalViews: blogs.reduce((sum, b) => sum + (b.views || 0), 0),
  }

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Blog Management</h1>
            <p className="text-gray-600 mt-1">Create and manage your blog posts</p>
          </div>
          <Link href="/blogs/create">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Add New Blog
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Blogs</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-emerald">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Published</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.published}</div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Eye className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-orange">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Drafts</div>
                  <div className="text-3xl font-bold text-amber-600 mt-2">{stats.draft}</div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <EyeOff className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-purple">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Views</div>
                  <div className="text-3xl font-bold text-purple-600 mt-2">{stats.totalViews}</div>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <EyeIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <Input
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchBlogs} variant="outline" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Table */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <CardTitle className="text-lg font-semibold text-gray-900">All Blogs</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 bg-gray-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Cover</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Title & Author</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden md:table-cell">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden sm:table-cell">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No blogs found</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((blog, idx) => (
                        <tr key={blog._id} className={`hover:bg-gray-50/50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
                              {blog.coverImage ? (
                                <img src={blog.coverImage} alt={blog.title} className="h-12 w-12 object-cover" />
                              ) : (
                                <FileText className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{blog.title}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-500">{blog.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 rounded-full">
                              {typeof blog.category === 'object' ? blog.category?.name : blog.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => togglePublish(blog._id, blog.isPublished)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                blog.isPublished
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              {blog.isPublished ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Draft
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{blog.views || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(blog.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/blogs/edit/${blog._id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedBlog(blog)
                                  setShowDeleteModal(true)
                                }}
                                className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <p className="text-sm text-gray-600">Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{blogs.length}</span> blogs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBlog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out',
          }}>
            <style>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>

            {/* Modal Header */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1f2937',
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                Delete Blog?
              </h2>
            </div>

            {/* Modal Message */}
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
            }}>
              This action cannot be undone. The blog post will be permanently deleted.
            </p>

            {/* Blog Info */}
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{
                height: '48px',
                width: '48px',
                borderRadius: '8px',
                background: '#e5e7eb',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selectedBlog.coverImage ? (
                  <img src={selectedBlog.coverImage} alt={selectedBlog.title} style={{ height: '48px', width: '48px', objectFit: 'cover' }} />
                ) : (
                  <FileText style={{ height: '24px', width: '24px', color: '#9ca3af' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>{selectedBlog.title}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>by {selectedBlog.author}</p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedBlog(null)
                }}
                disabled={deleting}
                style={{
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  opacity: deleting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => deleting === false && (e.currentTarget.style.borderColor = '#d1d5db')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '12px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: deleting ? 0.8 : 1,
                }}
                onMouseEnter={(e) => deleting === false && (e.currentTarget.style.background = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Blog
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
