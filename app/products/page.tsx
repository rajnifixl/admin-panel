"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, MoreHorizontal, Plus, Package, Eye, Pencil, Trash2, Filter, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

const categoryColors: Record<string, string> = {
  Men: "bg-blue-100 text-blue-700",
  Women: "bg-pink-100 text-pink-700",
  Kids: "bg-green-100 text-green-700",
}

// Stock status helper
const getStockStatus = (stock: number) => {
  if (stock === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-700", icon: "🔴" }
  if (stock < 10) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-700", icon: "🟡" }
  return { status: "In Stock", color: "bg-green-100 text-green-700", icon: "🟢" }
}

export default function ProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching products...')
      const data = await authFetch('/api/product/list')
      console.log('📡 Products response:', data)
      
      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error(data.message || "Failed to fetch products")
      }
    } catch (err: any) {
      console.error('❌ Fetch products error:', err.message)
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
    fetchProducts()
  }, [router])

  // ── DELETE ──
  const handleDelete = async () => {
    if (!selectedProduct) return
    setDeleting(true)
    try {
      const data = await authFetch(`/api/product/remove/${selectedProduct._id}`, {
        method: 'DELETE',
      })
      
      if (data.success) {
        toast.success("Product deleted!")
        setProducts(prev => prev.filter(p => p._id !== selectedProduct._id))
        setShowDeleteModal(false)
        setSelectedProduct(null)
      } else {
        toast.error(data.message || "Failed to delete")
      }
    } catch (err: any) {
      console.error('❌ Delete product error:', err.message)
      toast.error(err.message || "Failed to delete product")
    } finally {
      setDeleting(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === "all" || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchProducts}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Link href="/products/add">
              <Button><Plus className="mr-2 h-4 w-4" />Add Product</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">In Stock</div>
              <div className="text-2xl font-bold text-green-600">{products.filter(p => (p.stock ?? 50) > 10).length}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-bold text-yellow-600">{products.filter(p => (p.stock ?? 50) > 0 && (p.stock ?? 50) <= 10).length}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Out of Stock</div>
              <div className="text-2xl font-bold text-red-600">{products.filter(p => (p.stock ?? 50) === 0).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">All Products</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search products..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-64" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map(product => {
                      const stock = product.stock ?? 50
                      const stockInfo = getStockStatus(stock)
                      return (
                        <tr key={product._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                {product.image?.[0]
                                  ? <img src={product.image[0]} alt={product.name} className="h-10 w-10 object-cover" />
                                  : <Package className="h-5 w-5 text-muted-foreground m-auto mt-2.5" />}
                              </div>
                              <span className="text-sm font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="secondary" className={categoryColors[product.category] || ""}>
                              {product.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">₹{product.price}</td>
                          <td className="px-4 py-3 text-sm hidden sm:table-cell">{stock} units</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className={stockInfo.color}>
                              {stockInfo.icon} {stockInfo.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/products/${product._id}`)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/products/edit/${product._id}`)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => {
                                  setSelectedProduct(product)
                                  setShowDeleteModal(true)
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Showing {filteredProducts.length} of {products.length} products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedProduct && (
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
                color: '#2d2520',
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                Are you sure?
              </h2>
            </div>

            {/* Modal Message */}
            <p style={{
              fontSize: '14px',
              color: '#6b5c48',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
            }}>
              This action cannot be undone. The product will be permanently deleted from the database.
            </p>

            {/* Product Info */}
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#f5f0ea',
              border: '1px solid #e8e4df',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{
                height: '48px',
                width: '48px',
                borderRadius: '8px',
                background: '#e8e4df',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {selectedProduct.image?.[0] ? (
                  <img src={selectedProduct.image[0]} alt={selectedProduct.name} style={{ height: '48px', width: '48px', objectFit: 'cover' }} />
                ) : (
                  <Package style={{ height: '24px', width: '24px', color: '#9b8878', margin: '12px auto' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#2d2520', margin: 0 }}>{selectedProduct.name}</p>
                <p style={{ fontSize: '12px', color: '#9b8878', margin: '4px 0 0 0' }}>₹{selectedProduct.price}</p>
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
                  setSelectedProduct(null)
                }}
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
    </AdminLayout>
  )
}
