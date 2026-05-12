"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon, RefreshCw, Calendar } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function BannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    buttonText: "Shop Now",
    redirectUrl: "/",
    isActive: true,
    displayOrder: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  })
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    fetchBanners()
  }, [router])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const data = await authFetch('/api/banner/list')
      if (data.success) {
        setBanners(data.banners)
      } else {
        toast.error(data.message || "Failed to fetch banners")
      }
    } catch (err: any) {
      console.error('❌ Fetch banners error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', file)

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formDataObj,
        headers: {
          'token': localStorage.getItem('adminToken') || '',
        },
      })

      const data = await response.json()
      if (data.success) {
        setFormData({ ...formData, image: data.url })
        setImagePreview(data.url)
        toast.success("Image uploaded successfully")
      } else {
        toast.error(data.message || "Failed to upload image")
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.image) {
      toast.error("Title and image are required")
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      const url = editingBanner
        ? `${BACKEND_URL}/api/banner/${editingBanner._id}`
        : `${BACKEND_URL}/api/banner/create`
      const method = editingBanner ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          token: token || "",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingBanner ? "Banner updated!" : "Banner created!")
        setShowModal(false)
        resetForm()
        fetchBanners()
      } else {
        toast.error(data.message || "Failed to save banner")
      }
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error("Failed to save banner")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/banner/${id}`, {
        method: "DELETE",
        headers: { token: token || "" },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Banner deleted!")
        fetchBanners()
      } else {
        toast.error(data.message || "Failed to delete banner")
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast.error("Failed to delete banner")
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/banner/${id}/toggle`, {
        method: "PATCH",
        headers: { token: token || "" },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Banner status updated!")
        fetchBanners()
      } else {
        toast.error(data.message || "Failed to update banner")
      }
    } catch (error) {
      console.error('❌ Toggle error:', error)
      toast.error("Failed to update banner")
    }
  }

  const handleEdit = (banner: any) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      buttonText: banner.buttonText,
      redirectUrl: banner.redirectUrl,
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
      startDate: banner.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      endDate: banner.endDate?.split('T')[0] || "",
    })
    setImagePreview(banner.image)
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingBanner(null)
    setFormData({
      title: "",
      subtitle: "",
      image: "",
      buttonText: "Shop Now",
      redirectUrl: "/",
      isActive: true,
      displayOrder: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    })
    setImagePreview("")
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading banners...</p>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Banners</h1>
            <p className="text-gray-600 mt-1">Manage homepage banners and promotional content</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchBanners()} variant="outline" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {editingBanner ? "Edit Banner" : "Create New Banner"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Banner title"
                      className="form-input"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="form-group">
                    <label className="form-label">Subtitle</label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Banner subtitle"
                      className="form-input"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="form-group">
                    <label className="form-label">Banner Image *</label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="form-input"
                        />
                      </div>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                        />
                      )}
                    </div>
                  </div>

                  {/* Button Text */}
                  <div className="form-group">
                    <label className="form-label">Button Text</label>
                    <Input
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      placeholder="Shop Now"
                      className="form-input"
                    />
                  </div>

                  {/* Redirect URL */}
                  <div className="form-group">
                    <label className="form-label">Redirect URL</label>
                    <Input
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      placeholder="/"
                      className="form-input"
                    />
                  </div>

                  {/* Display Order */}
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                      className="form-input"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="form-input"
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

                  {/* Submit */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={() => setShowModal(false)} className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      {editingBanner ? "Update Banner" : "Create Banner"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <Card className="shadow-sm border-0 card-premium">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-blue-50 rounded-2xl mb-4">
                <ImageIcon className="h-12 w-12 text-blue-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">No banners yet</p>
              <p className="text-gray-600 mt-1">Create your first banner to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, idx) => (
              <div key={banner._id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <Card className="shadow-sm border-0 card-premium overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'} border-0 font-semibold`}
                      >
                        {banner.isActive ? '✓ Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Section */}
                  <CardContent className="pt-5 pb-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{banner.subtitle}</p>
                    )}
                    
                    {/* Meta Info */}
                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Order: <span className="font-semibold text-gray-900">{banner.displayOrder}</span></span>
                      </div>
                      {banner.startDate && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Start:</span> {new Date(banner.startDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(banner)}
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(banner._id)}
                        className="hover:bg-amber-50 hover:text-amber-600 transition-colors duration-200"
                        title={banner.isActive ? "Deactivate" : "Activate"}
                      >
                        {banner.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(banner._id)}
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
