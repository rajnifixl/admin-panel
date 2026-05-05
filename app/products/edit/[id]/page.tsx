"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ImagePlus, X, GripVertical, Loader2, CheckCircle2, Star, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const CATEGORIES = ["Men", "Women", "Kids"]
const SUB_CATEGORIES = ["Topwear", "Bottomwear", "Winterwear"]
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"]

interface ImageItem { id: string; file?: File; preview: string; isExisting?: boolean }

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Men",
    subCategory: "Topwear",
    stock: "",
    brand: "",
    sku: "",
    bestseller: false,
  })

  const getToken = () => localStorage.getItem("adminToken") || ""

  // Fetch product details on mount
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        console.log("📥 Fetching product ID:", productId)
        const res = await fetch(`${BACKEND_URL}/api/product/single/${productId}`)
        const data = await res.json()
        console.log("📥 Response:", data)
        if (data.success) {
          const product = data.product
          setForm({
            name: product.name || "",
            description: product.description || "",
            price: product.price || "",
            category: product.category || "Men",
            subCategory: product.subCategory || "Topwear",
            stock: product.stock || "",
            brand: product.brand || "",
            sku: product.sku || "",
            bestseller: product.bestseller || false,
          })

          // Set existing images
          if (product.image && product.image.length > 0) {
            const existingImages: ImageItem[] = product.image.map((img: string, idx: number) => ({
              id: `existing-${idx}`,
              preview: img,
              isExisting: true,
            }))
            setImages(existingImages)
          }

          // Set sizes
          if (product.sizes && product.sizes.length > 0) {
            setSelectedSizes(product.sizes)
          }
        } else {
          toast.error("Product not found")
          router.push("/products")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImages = (files: FileList | null) => {
    if (!files) return
    const remaining = 10 - images.length
    if (remaining <= 0) {
      toast.error("Maximum 10 images allowed")
      return
    }
    const toProcess = Math.min(files.length, remaining)
    const newImages: ImageItem[] = []
    let processed = 0

    Array.from(files).slice(0, toProcess).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newImages.push({
          id: Math.random().toString(36).slice(2),
          file,
          preview: e.target?.result as string,
          isExisting: false,
        })
        processed++
        if (processed === toProcess) {
          setImages(prev => [...prev, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDropIndex(index)
  }
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newImages = [...images]
    const [dragged] = newImages.splice(dragIndex, 1)
    newImages.splice(index, 0, dragged)
    setImages(newImages)
    setDragIndex(null)
    setDropIndex(null)
  }

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Valid price is required")
      return
    }
    if (selectedSizes.length === 0) {
      toast.error("Select at least one size")
      return
    }
    if (images.length === 0) {
      toast.error("At least one image is required")
      return
    }

    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("description", form.description)
    formData.append("price", form.price)
    formData.append("category", form.category)
    formData.append("subCategory", form.subCategory)
    formData.append("type", form.category.toLowerCase())
    formData.append("bestseller", String(form.bestseller))
    formData.append("sizes", JSON.stringify(selectedSizes))
    formData.append("stock", form.stock || "0")
    formData.append("brand", form.brand)
    formData.append("sku", form.sku)

    // Add new images only (not existing ones)
    let newImageCount = 0
    images.forEach((img) => {
      if (img.file) {
        formData.append("images", img.file)
        newImageCount++
      }
    })

    // If no new images, keep existing ones
    if (newImageCount === 0) {
      const existingImages = images.filter(img => img.isExisting).map(img => img.preview)
      formData.append("existingImages", JSON.stringify(existingImages))
    }

    setSubmitting(true)
    try {
      const token = getToken()
      const response = await fetch(`${BACKEND_URL}/api/product/update/${productId}`, {
        method: "PUT",
        headers: { authorization: token },
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Product updated successfully!")
        setTimeout(() => router.push("/products"), 1200)
      } else {
        toast.error(data.message || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to connect to server")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = getToken()
      const response = await fetch(`${BACKEND_URL}/api/product/remove/${productId}`, {
        method: "DELETE",
        headers: { authorization: token },
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Product deleted successfully!")
        setTimeout(() => router.push("/products"), 1200)
      } else {
        toast.error(data.message || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
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

  return (
    <AdminLayout>
      <style>{`
        .ep-page { font-family: 'Georgia', serif; }
        .ep-section { background: #fff; border: 1px solid #e8e4df; border-radius: 16px; padding: 28px; margin-bottom: 20px; }
        .ep-section-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8b7355; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .ep-section-title::after { content: ''; flex: 1; height: 1px; background: #e8e4df; }
        .ep-upload-zone { border: 2px dashed #d4c9bc; border-radius: 14px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .ep-upload-zone:hover, .ep-upload-zone.drag-over { border-color: #8b7355; background: #f5f0ea; }
        .ep-upload-icon { width: 48px; height: 48px; background: #f0ebe3; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .ep-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
        .ep-img-item { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 2px solid #e8e4df; transition: all 0.2s; cursor: grab; }
        .ep-img-item:active { cursor: grabbing; }
        .ep-img-item.is-drop { border-color: #8b7355; transform: scale(1.03); box-shadow: 0 4px 16px rgba(139,115,85,0.2); }
        .ep-img-item img { width: 100%; height: 100%; object-fit: cover; }
        .ep-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.2s; display: flex; align-items: flex-start; justify-content: space-between; padding: 6px; }
        .ep-img-item:hover .ep-img-overlay { background: rgba(0,0,0,0.25); }
        .ep-img-remove { width: 22px; height: 22px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .ep-img-item:hover .ep-img-remove { opacity: 1; }
        .ep-img-drag { opacity: 0; transition: opacity 0.2s; color: white; }
        .ep-img-item:hover .ep-img-drag { opacity: 1; }
        .ep-main-badge { position: absolute; bottom: 6px; left: 6px; background: #8b7355; color: white; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }
        .ep-num-badge { position: absolute; top: 6px; left: 6px; width: 20px; height: 20px; background: rgba(0,0,0,0.5); color: white; font-size: 10px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .ep-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; color: #2d2520; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; }
        .ep-input:focus { border-color: #8b7355; background: #fff; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .ep-label { font-size: 12px; font-weight: 600; color: #6b5c48; letter-spacing: 0.3px; margin-bottom: 6px; display: block; }
        .ep-size-btn { padding: 8px 18px; border: 1.5px solid #e8e4df; border-radius: 8px; background: #faf8f5; font-size: 13px; font-weight: 600; color: #6b5c48; cursor: pointer; transition: all 0.18s; font-family: inherit; }
        .ep-size-btn:hover { border-color: #8b7355; color: #8b7355; }
        .ep-size-btn.selected { background: #2d2520; border-color: #2d2520; color: white; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(45,37,32,0.2); }
        .ep-submit { width: 100%; padding: 14px; background: #2d2520; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .ep-submit:hover:not(:disabled) { background: #1a1410; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,37,32,0.25); }
        .ep-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .ep-cancel { width: 100%; padding: 14px; background: transparent; color: #6b5c48; border: 1.5px solid #e8e4df; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ep-cancel:hover { border-color: #8b7355; color: #8b7355; }
        .ep-bestseller { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fdf8f0; border: 1.5px solid #f0e6d0; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .ep-bestseller:hover { border-color: #d4a853; background: #fef5e0; }
        .ep-bestseller input { width: 18px; height: 18px; accent-color: #d4a853; cursor: pointer; }
        .ep-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ep-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 640px) { .ep-img-grid { grid-template-columns: repeat(3, 1fr); } .ep-grid-2 { grid-template-columns: 1fr; } .ep-grid-4 { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="ep-page max-w-3xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/products/${productId}`}>
            <button style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e8e4df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5c48' }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2d2520', margin: 0, letterSpacing: '-0.5px' }}>Edit Product</h1>
            <p style={{ fontSize: 13, color: '#9b8878', margin: 0, marginTop: 2 }}>Update product details and images</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* IMAGES */}
          <div className="ep-section">
            <div className="ep-section-title"><ImagePlus size={14} /> Product Images</div>

            <div
              className={`ep-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => imageInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImages(e.dataTransfer.files) }}
            >
              <div className="ep-upload-icon">
                <ImagePlus size={22} color="#8b7355" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2520', margin: '0 0 4px' }}>
                Click to browse or drag & drop
              </p>
              <p style={{ fontSize: 12, color: '#9b8878', margin: 0 }}>
                Add new images or replace existing ones • {images.length}/10 • First image = Main
              </p>
              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={e => handleImages(e.target.files)} />
            </div>

            {images.length > 0 && (
              <div className="ep-img-grid">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`ep-img-item ${dropIndex === index ? 'is-drop' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={() => { setDragIndex(null); setDropIndex(null) }}
                  >
                    <img src={img.preview} alt="" />
                    <div className="ep-img-overlay">
                      <GripVertical size={14} className="ep-img-drag" />
                      <button type="button" className="ep-img-remove" onClick={() => removeImage(img.id)}>
                        <X size={11} />
                      </button>
                    </div>
                    <div className="ep-num-badge">{index + 1}</div>
                    {index === 0 && <div className="ep-main-badge">Main</div>}
                    {img.isExisting && (
                      <div style={{ position: 'absolute', bottom: 6, right: 6, background: '#3b82f6', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                        Existing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT DETAILS */}
          <div className="ep-section">
            <div className="ep-section-title">Product Details</div>

            <div style={{ marginBottom: 16 }}>
              <label className="ep-label">Product Name *</label>
              <input className="ep-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Cotton Summer T-Shirt" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="ep-label">Description</label>
              <textarea className="ep-input" name="description" value={form.description} onChange={handleChange}
                placeholder="Describe your product in detail..." rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div className="ep-grid-4" style={{ marginBottom: 16 }}>
              <div>
                <label className="ep-label">Price (₹) *</label>
                <input className="ep-input" name="price" type="number" value={form.price} onChange={handleChange} placeholder="499" min="0" required />
              </div>
              <div>
                <label className="ep-label">Stock</label>
                <input className="ep-input" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="50" min="0" />
              </div>
              <div>
                <label className="ep-label">Brand</label>
                <input className="ep-input" name="brand" value={form.brand} onChange={handleChange} placeholder="Nike" />
              </div>
              <div>
                <label className="ep-label">SKU</label>
                <input className="ep-input" name="sku" value={form.sku} onChange={handleChange} placeholder="NK-001" />
              </div>
            </div>

            <div className="ep-grid-2">
              <div>
                <label className="ep-label">Category *</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger style={{ border: '1.5px solid #e8e4df', background: '#faf8f5', borderRadius: 10 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="ep-label">Sub Category *</label>
                <Select value={form.subCategory} onValueChange={v => setForm(p => ({ ...p, subCategory: v }))}>
                  <SelectTrigger style={{ border: '1.5px solid #e8e4df', background: '#faf8f5', borderRadius: 10 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SIZES */}
          <div className="ep-section">
            <div className="ep-section-title">Available Sizes *</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIZES.map(size => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  className={`ep-size-btn ${selectedSizes.includes(size) ? 'selected' : ''}`}>
                  {selectedSizes.includes(size) && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
                  {size}
                </button>
              ))}
            </div>
            {selectedSizes.length > 0 && (
              <p style={{ fontSize: 12, color: '#9b8878', marginTop: 10, marginBottom: 0 }}>
                Selected: <strong style={{ color: '#6b5c48' }}>{selectedSizes.join(", ")}</strong>
              </p>
            )}
          </div>

          {/* BESTSELLER */}
          <div className="ep-section">
            <label className="ep-bestseller">
              <input type="checkbox" name="bestseller" checked={form.bestseller} onChange={handleChange} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2520', margin: 0 }}>
                  <Star size={14} style={{ display: 'inline', marginRight: 6, color: '#d4a853', verticalAlign: 'middle' }} />
                  Mark as Bestseller
                </p>
                <p style={{ fontSize: 12, color: '#9b8878', margin: '2px 0 0' }}>Featured product will appear in bestseller section</p>
              </div>
            </label>
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Link href={`/products/${productId}`}>
              <button type="button" className="ep-cancel">Cancel</button>
            </Link>
            <button type="submit" className="ep-submit" disabled={submitting}>
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                : <><CheckCircle2 size={16} /> Update Product</>
              }
            </button>
          </div>

          {/* DELETE BUTTON */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e8e4df' }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
            >
              Delete Product
            </button>
          </div>
        </form>

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
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

              {/* Modal Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
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
                      <X size={16} />
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
