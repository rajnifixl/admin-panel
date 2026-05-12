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
import { Search, MoreHorizontal, Plus, Package, Eye, Pencil, Trash2, Filter, RefreshCw, Loader2, ShoppingCart, AlertCircle, AlertTriangle } from "lucide-react"
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchProducts} className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Link href="/products/add">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"><Plus className="mr-2 h-4 w-4" />Add Product</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Products</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{products.length}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">In Stock</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-2">{products.filter(p => (p.stock ?? 50) > 10).length}</div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <ShoppingCart className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Low Stock</div>
                  <div className="text-3xl font-bold text-amber-600 mt-2">{products.filter(p => (p.stock ?? 50) > 0 && (p.stock ?? 50) <= 10).length}</div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Out of Stock</div>
                  <div className="text-3xl font-bold text-red-600 mt-2">{products.filter(p => (p.stock ?? 50) === 0).length}</div>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">All Products</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <Input placeholder="Search products..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-64 bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg" />
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
              </div>
            </div>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden md:table-cell">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hidden sm:table-cell">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredProducts.map((product, idx) => {
                      const stock = product.stock ?? 50
                      const stockInfo = getStockStatus(stock)
                      return (
                        <tr key={product._id} className={`hover:bg-gray-50/50 transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex-shrink-0 shadow-sm">
                                {product.image?.[0]
                                  ? <img src={product.image[0]} alt={product.name} className="h-12 w-12 object-cover" />
                                  : <Package className="h-6 w-6 text-gray-400 m-auto mt-3" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">ID: {product._id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <Badge variant="secondary" className={`${categoryColors[product.category] || 'bg-gray-100 text-gray-700'} rounded-full`}>
                              {product.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.price}</td>
                          <td className="px-6 py-4 text-sm hidden sm:table-cell text-gray-600">{stock} units</td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className={`${stockInfo.color} rounded-full`}>
                              {stockInfo.icon} {stockInfo.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 transition-colors duration-200">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/products/${product._id}`)} className="cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/products/edit/${product._id}`)} className="cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                  <Pencil className="mr-2 h-4 w-4" /> Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 cursor-pointer hover:bg-red-50 transition-colors duration-200" onClick={() => {
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
              <p className="text-sm text-gray-600">Showing <span className="font-semibold">{filteredProducts.length}</span> of <span className="font-semibold">{products.length}</span> products</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-100 transition-colors duration-200">Previous</Button>
                <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-100 transition-colors duration-200">Next</Button>
              </div>
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
