"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Zap, RefreshCw, Clock, Package } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function FlashSalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSale, setEditingSale] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    products: [] as any[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    isActive: true,
    displayOrder: 0,
    backgroundColor: "#ff6b6b",
  })
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salesData, productsData] = await Promise.all([
        authFetch('/api/flash-sale/list'),
        authFetch('/api/product/list'),
      ])

      if (salesData.success) {
        setSales(salesData.sales)
      }
      if (productsData.success) {
        setProducts(productsData.products)
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = (product: any) => {
    if (selectedProducts.find(p => p.productId === product._id)) {
      toast.error("Product already added")
      return
    }

    setSelectedProducts([
      ...selectedProducts,
      {
        productId: product._id,
        discountPercentage: 10,
        originalPrice: product.price,
        salePrice: Math.round(product.price * 0.9),
      },
    ])
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))
  }

  const handleDiscountChange = (productId: string, discount: number) => {
    setSelectedProducts(
      selectedProducts.map(p => {
        if (p.productId === productId) {
          const salePrice = Math.round(p.originalPrice * (1 - discount / 100))
          return { ...p, discountPercentage: discount, salePrice }
        }
        return p
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || selectedProducts.length === 0) {
      toast.error("Title and at least one product are required")
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("Start date must be before end date")
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      const url = editingSale
        ? `${BACKEND_URL}/api/flash-sale/${editingSale._id}`
        : `${BACKEND_URL}/api/flash-sale/create`
      const method = editingSale ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          token: token || "",
        },
        body: JSON.stringify({
          ...formData,
          products: selectedProducts,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingSale ? "Flash sale updated!" : "Flash sale created!")
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.message || "Failed to save flash sale")
      }
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error("Failed to save flash sale")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flash sale?")) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/flash-sale/${id}`, {
        method: "DELETE",
        headers: { token: token || "" },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Flash sale deleted!")
        fetchData()
      } else {
        toast.error(data.message || "Failed to delete flash sale")
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast.error("Failed to delete flash sale")
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/flash-sale/${id}/toggle`, {
        method: "PATCH",
        headers: { token: token || "" },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Flash sale status updated!")
        fetchData()
      } else {
        toast.error(data.message || "Failed to update flash sale")
      }
    } catch (error) {
      console.error('❌ Toggle error:', error)
      toast.error("Failed to update flash sale")
    }
  }

  const handleEdit = (sale: any) => {
    setEditingSale(sale)
    setFormData({
      title: sale.title,
      description: sale.description,
      products: sale.products,
      startDate: sale.startDate?.split('T')[0],
      endDate: sale.endDate?.split('T')[0],
      isActive: sale.isActive,
      displayOrder: sale.displayOrder,
      backgroundColor: sale.backgroundColor,
    })
    setSelectedProducts(sale.products)
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingSale(null)
    setFormData({
      title: "",
      description: "",
      products: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      isActive: true,
      displayOrder: 0,
      backgroundColor: "#ff6b6b",
    })
    setSelectedProducts([])
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading flash sales...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Flash Sales</h1>
            <p className="text-gray-600 mt-1">Manage time-limited promotional sales</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchData()} variant="outline" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Flash Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {editingSale ? "Edit Flash Sale" : "Create New Flash Sale"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Flash sale title"
                      maxLength="100"
                      className="form-input"
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Flash sale description"
                      maxLength="500"
                      className="form-input"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <Input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <Input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Display Order */}
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                      inputMode="numeric"
                      min="0"
                      className="form-input"
                    />
                  </div>

                  {/* Background Color */}
                  <div className="form-group">
                    <label className="form-label">Background Color</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="w-20 h-10 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        placeholder="#ff6b6b"
                        maxLength="7"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        className="form-input flex-1"
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>

                  {/* Products Section */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Products ({selectedProducts.length})
                    </h3>

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                        {selectedProducts.map((item) => {
                          const product = products.find(p => p._id === item.productId)
                          return (
                            <div key={item.productId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow duration-200">
                              <img
                                src={product?.image?.[0]}
                                alt={product?.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{product?.name}</p>
                                <p className="text-sm text-gray-600">₹{item.originalPrice}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.discountPercentage}
                                    onChange={(e) => handleDiscountChange(item.productId, parseInt(e.target.value))}
                                    className="w-16 form-input text-center"
                                    placeholder="Discount %"
                                  />
                                  <span className="text-xs font-semibold text-gray-600">%</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">Sale Price</p>
                                  <p className="font-bold text-emerald-600">₹{item.salePrice}</p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveProduct(item.productId)}
                                  className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add Products */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                      {products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No products available</p>
                        </div>
                      ) : products
                        .filter(p => !selectedProducts.find(sp => sp.productId === p._id))
                        .map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-3 hover:bg-white rounded-lg cursor-pointer transition-colors duration-200 border border-transparent hover:border-gray-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img
                                src={product.image?.[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs text-gray-600">₹{product.price}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddProduct(product)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-200"
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={() => setShowModal(false)} className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      {editingSale ? "Update Flash Sale" : "Create Flash Sale"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Flash Sales List */}
        {sales.length === 0 ? (
          <Card className="shadow-sm border-0 card-premium">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-orange-50 rounded-2xl mb-4">
                <Zap className="h-12 w-12 text-orange-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">No flash sales yet</p>
              <p className="text-gray-600 mt-1">Create your first flash sale to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sales.map((sale, idx) => (
              <div key={sale._id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <Card className="shadow-sm border-0 card-premium hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Zap className="h-5 w-5 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-lg text-gray-900">{sale.title}</h3>
                        </div>
                        {sale.description && (
                          <p className="text-sm text-gray-600 ml-10">{sale.description}</p>
                        )}
                      </div>
                      <Badge
                        className={`${sale.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'} border-0 font-semibold whitespace-nowrap`}
                      >
                        {sale.isActive ? '✓ Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{sale.products?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(sale.startDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(sale.endDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{sale.displayOrder}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(sale)}
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(sale._id)}
                        className="hover:bg-amber-50 hover:text-amber-600 transition-colors duration-200"
                        title={sale.isActive ? "Deactivate" : "Activate"}
                      >
                        {sale.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(sale._id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
