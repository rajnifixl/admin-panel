"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, AlertCircle, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ProductDetailView } from "@/components/admin/product-detail-view"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getToken = () => localStorage.getItem("adminToken") || ""

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        console.log("📥 Fetching product ID:", productId)
        const res = await fetch(`${BACKEND_URL}/api/product/single/${productId}`)
        const data = await res.json()
        console.log("📥 Response:", data)
        if (data.success) {
          setProduct(data.product)
        } else {
          toast.error("Product not found")
          router.push("/products")
        }
      } catch (error) {
        console.error("❌ Error fetching product:", error)
        toast.error("Failed to fetch product details")
        router.push("/products")
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, router])

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/product/remove/${productId}`, {
        method: "DELETE",
        headers: { authorization: getToken() },
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Product deleted successfully!")
        router.push("/products")
      } else {
        toast.error(data.message || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading product details...</span>
        </div>
      </AdminLayout>
    )
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Product not found</p>
          <Link href="/products">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-muted-foreground">Product ID: {product._id}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        {/* Product Detail View - Reused from drawer UI */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-border p-6">
          <ProductDetailView
            product={product}
            productId={productId}
            showActions={true}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
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

              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#2d2520',
                margin: '0 0 16px 0',
                letterSpacing: '-0.5px',
              }}>
                Are you sure?
              </h2>

              <p style={{
                fontSize: '14px',
                color: '#6b5c48',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
              }}>
                This action cannot be undone. The product will be permanently deleted from the database.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    padding: '12px 16px',
                    background: '#f5f0ea',
                    color: '#6b5c48',
                    border: '1.5px solid #e8e4df',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    opacity: deleting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => !deleting && (e.currentTarget.style.borderColor = '#8b7355')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e8e4df')}
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
                  onMouseEnter={(e) => !deleting && (e.currentTarget.style.background = '#dc2626')}
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
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
