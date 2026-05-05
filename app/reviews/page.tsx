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
import { Search, Filter, RefreshCw, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Reviews</h1>
            <p className="text-muted-foreground">Manage and moderate customer reviews</p>
          </div>
          <Button onClick={fetchReviews} variant="outline" size="sm">
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
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.avgRating}</div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.fiveStars}</div>
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.oneStars}</div>
                <p className="text-sm text-muted-foreground">1-Star Reviews</p>
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
                    placeholder="Search by product, user, or comment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40">
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Loading reviews...</div>
                </div>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">No reviews found</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((review) => (
              <Card key={review._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Product & User */}
                      <div>
                        <h3 className="font-semibold text-lg">{review.productName}</h3>
                        <p className="text-sm text-muted-foreground">by {review.userName}</p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()} at{" "}
                        {new Date(review.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedReview(review)
                          setShowDeleteDialog(true)
                        }}
                        disabled={deletingId === review._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Product: <strong>{selectedReview?.productName}</strong></p>
                <p>User: <strong>{selectedReview?.userName}</strong></p>
                <p className="text-sm text-red-600 mt-4">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
