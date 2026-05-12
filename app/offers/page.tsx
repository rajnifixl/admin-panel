"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

interface Offer {
  _id: string
  title: string
  offerType: string
  discountValue: number
  discountType: string
  isActive: boolean
  startDate: string
  endDate: string
  priority: number
  applicableCategories: string[]
  applicableProducts: string[]
}

export default function OffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }
    fetchOffers()
  }, [router, page, filterType, filterStatus, search])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "10")
      if (search) params.append("search", search)
      if (filterType !== "all") params.append("type", filterType)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const data = await authFetch(`/api/offer/list?${params}`)

      if (data.success) {
        setOffers(data.offers)
        setTotalPages(data.pagination.pages)
      } else {
        toast.error(data.message || "Failed to fetch offers")
      }
    } catch (error) {
      console.error("Error fetching offers:", error)
      toast.error("Failed to fetch offers")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return

    setDeleting(id)
    try {
      const data = await authFetch(`/api/offer/${id}`, { method: "DELETE" })

      if (data.success) {
        toast.success("Offer deleted successfully")
        fetchOffers()
      } else {
        toast.error(data.message || "Failed to delete offer")
      }
    } catch (error) {
      console.error("Error deleting offer:", error)
      toast.error("Failed to delete offer")
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      const data = await authFetch(`/api/offer/${id}/toggle`, { method: "PATCH" })

      if (data.success) {
        toast.success(data.message)
        fetchOffers()
      } else {
        toast.error(data.message || "Failed to toggle offer")
      }
    } catch (error) {
      console.error("Error toggling offer:", error)
      toast.error("Failed to toggle offer")
    } finally {
      setToggling(null)
    }
  }

  const getOfferTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      buyXGetY: "Buy X Get Y",
      flashSale: "Flash Sale",
      festive: "Festive Sale",
      categoryDiscount: "Category Discount",
      productDiscount: "Product Discount",
    }
    return labels[type] || type
  }

  const getDiscountLabel = (offer: Offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}%`
    }
    return `₹${offer.discountValue}`
  }

  const isOfferActive = (offer: Offer) => {
    const now = new Date()
    const start = new Date(offer.startDate)
    const end = new Date(offer.endDate)
    return now >= start && now <= end && offer.isActive
  }

  return (
    <AdminLayout>
      <style>{`
        .offers-page { font-family: 'Georgia', serif; }
        .offers-section { background: #fff; border: 1px solid #e8e4df; border-radius: 16px; padding: 28px; margin-bottom: 20px; }
        .offers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .offers-title { font-size: 26px; font-weight: 700; color: #2d2520; margin: 0; letter-spacing: '-0.5px'; }
        .offers-filters { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .offers-table { width: 100%; border-collapse: collapse; }
        .offers-table th { background: #faf8f5; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b5c48; letter-spacing: 0.3px; border-bottom: 1px solid #e8e4df; }
        .offers-table td { padding: 14px 12px; border-bottom: 1px solid #e8e4df; font-size: 13px; color: #2d2520; }
        .offers-table tr:hover { background: #fdf8f0; }
        .offer-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-inactive { background: #f8d7da; color: #721c24; }
        .badge-type { background: #e7f3ff; color: #004085; }
        .offer-actions { display: flex; gap: 8px; }
        .action-btn { width: 32px; height: 32px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 14px; }
        .action-btn-edit { background: #e7f3ff; color: #004085; }
        .action-btn-edit:hover { background: #004085; color: white; }
        .action-btn-delete { background: #f8d7da; color: #721c24; }
        .action-btn-delete:hover { background: #721c24; color: white; }
        .action-btn-toggle { background: #fff3cd; color: #856404; }
        .action-btn-toggle:hover { background: #856404; color: white; }
        .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
        .pagination-btn { padding: 8px 12px; border: 1px solid #e8e4df; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #6b5c48; transition: all 0.2s; }
        .pagination-btn:hover:not(:disabled) { border-color: #8b7355; color: #8b7355; }
        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pagination-info { padding: 8px 12px; font-size: 13px; color: #6b5c48; }
        .empty-state { text-align: center; padding: 40px 20px; }
        .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-state-text { font-size: 14px; color: #6b5c48; margin-bottom: 16px; }
        @media (max-width: 768px) { .offers-filters { grid-template-columns: 1fr 1fr; } .offers-table { font-size: 12px; } }
      `}</style>

      <div className="offers-page max-w-6xl mx-auto pb-10">
        {/* Header */}
        <div className="offers-header">
          <h1 className="offers-title">Offers Management</h1>
          <Link href="/offers/create">
            <Button style={{ background: "#2d2520", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} /> Create Offer
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="offers-section">
          <div className="offers-filters">
            <Input
              placeholder="Search offers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ border: "1.5px solid #e8e4df", borderRadius: "10px", padding: "10px 14px" }}
            />
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1) }}>
              <SelectTrigger style={{ border: "1.5px solid #e8e4df", borderRadius: "10px" }}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buyXGetY">Buy X Get Y</SelectItem>
                <SelectItem value="flashSale">Flash Sale</SelectItem>
                <SelectItem value="festive">Festive Sale</SelectItem>
                <SelectItem value="categoryDiscount">Category Discount</SelectItem>
                <SelectItem value="productDiscount">Product Discount</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
              <SelectTrigger style={{ border: "1.5px solid #e8e4df", borderRadius: "10px" }}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="offers-section">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
              <p style={{ marginTop: "12px", color: "#6b5c48" }}>Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">No offers found. Create your first offer!</p>
              <Link href="/offers/create">
                <Button style={{ background: "#2d2520", color: "white" }}>Create Offer</Button>
              </Link>
            </div>
          ) : (
            <>
              <table className="offers-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Discount</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer._id}>
                      <td style={{ fontWeight: 600 }}>{offer.title}</td>
                      <td>
                        <span className="offer-badge badge-type">{getOfferTypeLabel(offer.offerType)}</span>
                      </td>
                      <td>{getDiscountLabel(offer)}</td>
                      <td style={{ fontSize: "12px" }}>
                        {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`offer-badge ${isOfferActive(offer) ? "badge-active" : "badge-inactive"}`}>
                          {isOfferActive(offer) ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: "#f0ebe3", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                          {offer.priority}/10
                        </span>
                      </td>
                      <td>
                        <div className="offer-actions">
                          <Link href={`/offers/${offer._id}`}>
                            <button className="action-btn action-btn-edit" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          </Link>
                          <button
                            className="action-btn action-btn-toggle"
                            onClick={() => handleToggle(offer._id)}
                            disabled={toggling === offer._id}
                            title={offer.isActive ? "Disable" : "Enable"}
                          >
                            {toggling === offer._id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : offer.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleDelete(offer._id)}
                            disabled={deleting === offer._id}
                            title="Delete"
                          >
                            {deleting === offer._id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
