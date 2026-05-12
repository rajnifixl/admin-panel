"use client"

import { useState, useEffect } from "react"
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
import { Search, Filter, RefreshCw, Trash2, Star, MessageCircle, User, Calendar, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4"
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } transition-all duration-200`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getToken = () => localStorage.getItem("adminToken") || ""

  // Fetch all reviews
  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        setReviews(data.reviews)
      } else {
        toast.error("Failed to fetch reviews")
      }
    } catch (err) {
      toast.error("Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // Delete review
  const handleDelete = async () => {
    if (!selectedReview) return

    setDeletingId(selectedReview._id)
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/${selectedReview._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Review deleted successfully")
        setReviews(prev => prev.filter(r => r._id !== selectedReview._id))
        setShowDeleteDialog(false)
        setSelectedReview(null)
      } else {
        toast.error(data.message || "Failed to delete review")
      }
    } catch {
      toast.error("Cannot connect to backend")
    } finally {
      setDeletingId(null)
    }
  }
  const toggleApproval = async (reviewId: string, isApproved: boolean) => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/reviews/${reviewId}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isApproved }),
      }
    )

    const data = await res.json()

    if (data.success) {
      toast.success(
        `Review ${isApproved ? "approved" : "disapproved"}`
      )

      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? { ...r, isApproved }
            : r
        )
      )
    } else {
      toast.error(data.message)
    }
  } catch (error) {
    toast.error("Failed to update review")
  }
}

  // Filter and sort reviews
  let filtered = reviews.filter(review => {
    const search = searchQuery.toLowerCase()
    return (
      review.productName?.toLowerCase().includes(search) ||
      review.userName?.toLowerCase().includes(search) ||
      review.comment?.toLowerCase().includes(search)
    )
  })

  if (sortBy === "rating-high") {
    filtered.sort((a, b) => b.rating - a.rating)
  } else if (sortBy === "rating-low") {
    filtered.sort((a, b) => a.rating - b.rating)
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Stats
  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    oneStars: reviews.filter(r => r.rating === 1).length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Product Reviews</h1>
            <p className="text-gray-600 mt-1">Manage and moderate customer reviews</p>
          </div>
          <Button onClick={fetchReviews} variant="outline" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Reviews</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-orange">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Average Rating</div>
                  <div className="text-3xl font-bold text-amber-600 mt-2">{stats.avgRating}</div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 stat-card stat-card-emerald">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">5-Star Reviews</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.fiveStars}</div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Star className="h-6 w-6 text-emerald-600 fill-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">1-Star Reviews</div>
                  <div className="text-3xl font-bold text-red-600 mt-2">{stats.oneStars}</div>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
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
                  placeholder="Search by product, user, or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="rating-high">Rating: High to Low</SelectItem>
                  <SelectItem value="rating-low">Rating: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="shadow-sm border-0">
              <CardContent className="p-12">
                <div className="flex items-center justify-center text-gray-500">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading reviews...
                </div>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="shadow-sm border-0">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mb-3 text-gray-300" />
                  <p>No reviews found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((review, idx) => (
              <Card key={review._id} className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden shadow-sm flex items-center justify-center">
                        {review.productImage ? (
                          <img src={review.productImage} alt={review.productName} className="h-16 w-16 object-cover" />
                        ) : (
                          <MessageCircle className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 space-y-3">
                      {/* Product Name */}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{review.productName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{review.userName}</p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-3">
                        <StarRating rating={review.rating} size="lg" />
                        <span className="text-sm font-semibold text-gray-900">{review.rating}/5</span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(review.createdAt).toLocaleDateString()} at{" "}
                          {new Date(review.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex gap-2 mb-3">
  <Button
    size="sm"
    onClick={() =>
      toggleApproval(review._id, !review.isApproved)
    }
    className={
      review.isApproved
        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
        : "bg-green-100 text-green-700 hover:bg-green-200"
    }
  >
    {review.isApproved ? "Disapprove" : "Approve"}
  </Button>
</div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review)
                          setShowDeleteDialog(true)
                        }}
                        disabled={deletingId === review._id}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all duration-200 hover:shadow-md"
                      >
                        {deletingId === review._id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{reviews.length}</span> reviews
            </p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && selectedReview && (
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
                Delete Review?
              </h2>
            </div>

            {/* Modal Message */}
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
            }}>
              This action cannot be undone. The review will be permanently deleted.
            </p>

            {/* Review Info */}
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
                {selectedReview.productImage ? (
                  <img src={selectedReview.productImage} alt={selectedReview.productName} style={{ height: '48px', width: '48px', objectFit: 'cover' }} />
                ) : (
                  <MessageCircle style={{ height: '24px', width: '24px', color: '#9ca3af' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>{selectedReview.productName}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0 ' }}>by {selectedReview.userName}</p>
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
                  setShowDeleteDialog(false)
                  setSelectedReview(null)
                }}
                disabled={deletingId !== null}
                style={{
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  opacity: deletingId !== null ? 0.6 : 1,
                }}
                onMouseEnter={(e) => deletingId === null && (e.currentTarget.style.borderColor = '#d1d5db')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId !== null}
                style={{
                  padding: '12px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: deletingId !== null ? 0.8 : 1,
                }}
                onMouseEnter={(e) => deletingId === null && (e.currentTarget.style.background = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
              >
                {deletingId ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Review
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
