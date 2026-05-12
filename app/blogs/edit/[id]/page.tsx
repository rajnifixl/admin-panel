"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const blogId = params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; subcategories?: Array<{ _id: string; name: string }> }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<{ _id: string; name: string } | null>(null)
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "Admin",
    tags: "",
    videoUrl: ""
  })
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)
  const [existingCoverImage, setExistingCoverImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [existingGallery, setExistingGallery] = useState([])

  useEffect(() => {
    if (blogId) {
      fetchCategories()
      fetchBlog()
    }
  }, [blogId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/category/list`)
      const data = await response.json()
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories)
      } else {
        setCategories([{ name: "Other", _id: "default", subcategories: [] }])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([{ name: "Other", _id: "default", subcategories: [] }])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchBlog = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/admin/all`, {
        headers: { token }
      })
      const data = await response.json()
      
      if (data.success) {
        const blog = data.blogs.find(b => b._id === blogId)
        if (blog) {
          // Handle category - it could be ObjectId or populated object
          let categoryId = ""
          let categoryName = "Other"
          if (blog.category) {
            if (typeof blog.category === 'object') {
              categoryId = blog.category._id
              categoryName = blog.category.name
            } else {
              categoryId = blog.category
            }
          }
          
          setForm({
            title: blog.title || "",
            content: blog.content || "",
            excerpt: blog.excerpt || "",
            author: blog.author || "Admin",
            tags: blog.tags ? blog.tags.join(", ") : "",
            videoUrl: blog.videoUrl || ""
          })
          setSelectedCategory({ _id: categoryId, name: categoryName })
          setExistingCoverImage(blog.coverImage || null)
          setExistingGallery(blog.images || [])
        } else {
          toast.error("Blog not found")
          router.push("/blogs")
        }
      }
    } catch (error) {
      console.error("Error fetching blog:", error)
      toast.error("Failed to load blog")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCoverImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverImage(file)
      setCoverImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 10 - galleryImages.length
    const toAdd = files.slice(0, remaining)
    
    setGalleryImages(prev => [...prev, ...toAdd])
    
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGalleryPreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
    setExistingCoverImage(null)
  }

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingGalleryImage = (index) => {
    setExistingGallery(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (isDraft = false) => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.content.trim()) {
      toast.error("Content is required")
      return
    }

    setSaving(true)
    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("content", form.content)
    formData.append("excerpt", form.excerpt)
    formData.append("category", selectedCategory?._id || "")
    formData.append("author", form.author)
    formData.append("tags", form.tags)
    formData.append("videoUrl", form.videoUrl)
    formData.append("isPublished", String(!isDraft))

    if (coverImage) {
      formData.append("coverImage", coverImage)
    }
    galleryImages.forEach(img => {
      formData.append("images", img)
    })

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/update/${blogId}`, {
        method: "PUT",
        headers: { token },
        body: formData
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Blog updated successfully!")
        router.push("/blogs")
      } else {
        toast.error(data.message || "Failed to update blog")
      }
    } catch (error) {
      console.error("Error updating blog:", error)
      toast.error("Failed to connect to server")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#8b7355" }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <style>{`
        .abe-page { font-family: 'Georgia', serif; }
        .abe-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .abe-title { font-size: 26px; font-weight: 700; color: #2d2520; margin: 0; }
        .abe-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 992px) { .abe-layout { grid-template-columns: 1fr; } }
        .abe-section { background: white; border: 1px solid #e8e4df; border-radius: 16px; padding: 24px; }
        .abe-section-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8b7355; margin-bottom: 20px; }
        .abe-label { font-size: 12px; font-weight: 600; color: #6b5c48; margin-bottom: 6px; display: block; }
        .abe-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; }
        .abe-input:focus { border-color: #8b7355; background: white; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .abe-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; resize: vertical; }
        .abe-textarea:focus { border-color: #8b7355; background: white; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .abe-row { margin-bottom: 16px; }
        .abe-upload-zone { border: 2px dashed #d4c9bc; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .abe-upload-zone:hover { border-color: #8b7355; background: #f5f0ea; }
        .abe-upload-icon { width: 48px; height: 48px; background: #f0ebe3; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .abe-preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
        .abe-preview-item { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 2px solid #e8e4df; }
        .abe-preview-item img { width: 100%; height: 100%; object-fit: cover; }
        .abe-remove-btn { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .abe-select { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; cursor: pointer; }
        .abe-select:focus { border-color: #8b7355; background: white; }
        .abe-buttons { display: flex; gap: 12px; margin-top: 24px; }
        .abe-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .abe-btn-update { background: #2d2520; color: white; }
        .abe-btn-update:hover:not(:disabled) { background: #1a1410; }
        .abe-btn-draft { background: #f0ebe3; color: #6b5c48; }
        .abe-btn-draft:hover:not(:disabled) { background: #e8e4df; }
        .abe-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="abe-page max-w-5xl mx-auto pb-10">
        {/* Header */}
        <div className="abe-header">
          <Link href="/blogs">
            <button style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e8e4df", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b5c48" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="abe-title">Edit Blog</h1>
        </div>

        <div className="abe-layout">
          {/* Main Content */}
          <div className="abe-section">
            <div className="abe-section-title">Content</div>
            
            <div className="abe-row">
              <label className="abe-label">Title *</label>
              <input
                type="text"
                name="title"
                className="abe-input"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter blog title"
              />
            </div>

            <div className="abe-row">
              <label className="abe-label">Excerpt</label>
              <textarea
                name="excerpt"
                className="abe-textarea"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Brief description (optional)"
                rows={2}
              />
            </div>

            <div className="abe-row">
              <label className="abe-label">Content * (HTML supported)</label>
              <textarea
                name="content"
                className="abe-textarea"
                value={form.content}
                onChange={handleChange}
                placeholder="Write your blog content here... (HTML supported)"
                rows={16}
              />
            </div>

            <div className="abe-row">
              <label className="abe-label">Gallery Images (max 10)</label>
              <div
                className="abe-upload-zone"
                onClick={() => document.getElementById("gallery-input").click()}
              >
                <div className="abe-upload-icon">
                  <Upload size={22} color="#8b7355" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2520", margin: "0 0 4px" }}>
                  Click to upload more gallery images
                </p>
                <p style={{ fontSize: 12, color: "#9b8878", margin: 0 }}>
                  PNG, JPG, WEBP • Max 10 images total
                </p>
                <input
                  id="gallery-input"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleGalleryImages}
                />
              </div>
              
              {/* Existing Gallery */}
              {existingGallery.length > 0 && (
                <div className="abe-preview-grid">
                  {existingGallery.map((img, index) => (
                    <div key={`existing-${index}`} className="abe-preview-item">
                      <img src={img} alt={`Gallery ${index + 1}`} />
                      <button
                        type="button"
                        className="abe-remove-btn"
                        onClick={() => removeExistingGalleryImage(index)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* New Gallery Previews */}
              {galleryPreviews.length > 0 && (
                <div className="abe-preview-grid">
                  {galleryPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="abe-preview-item">
                      <img src={preview} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        className="abe-remove-btn"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="abe-section">
              <div className="abe-section-title">Cover Image</div>
              <div
                className="abe-upload-zone"
                onClick={() => document.getElementById("cover-input").click()}
              >
                {coverImagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={coverImagePreview} alt="Cover" style={{ maxHeight: 150, borderRadius: 8 }} />
                    <button
                      type="button"
                      className="abe-remove-btn"
                      onClick={(e) => { e.stopPropagation(); removeCoverImage(); }}
                      style={{ position: "absolute", top: 4, right: 4 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : existingCoverImage ? (
                  <div style={{ position: "relative" }}>
                    <img src={existingCoverImage} alt="Cover" style={{ maxHeight: 150, borderRadius: 8 }} />
                    <button
                      type="button"
                      className="abe-remove-btn"
                      onClick={(e) => { e.stopPropagation(); removeCoverImage(); }}
                      style={{ position: "absolute", top: 4, right: 4 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="abe-upload-icon">
                      <Upload size={22} color="#8b7355" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2520", margin: "0 0 4px" }}>
                      Upload cover image
                    </p>
                    <p style={{ fontSize: 12, color: "#9b8878", margin: 0 }}>
                      PNG, JPG, WEBP • Max 5MB
                    </p>
                  </>
                )}
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleCoverImage}
                />
              </div>
            </div>

            <div className="abe-section" style={{ marginTop: 24 }}>
              <div className="abe-section-title">Details</div>

              <div className="abe-row">
                <label className="abe-label">Category</label>
                <select
                  className="abe-select"
                  value={selectedCategory?._id || ""}
                  onChange={(e) => {
                    const catId = e.target.value
                    // Find in parent categories first
                    let cat = categories.find(c => c._id === catId)
                    // If not found, search in subcategories
                    if (!cat) {
                      for (const parent of categories) {
                        if (parent.subcategories) {
                          cat = parent.subcategories.find(s => s._id === catId)
                          if (cat) break
                        }
                      }
                    }
                    if (cat) {
                      setSelectedCategory(cat)
                    }
                  }}
                >
                  {categoriesLoading ? (
                    <option>Loading...</option>
                  ) : (
                    categories.map(cat => (
                      <optgroup key={cat._id} label={cat.name}>
                        <option value={cat._id}>{cat.name}</option>
                        {cat.subcategories && cat.subcategories.map(sub => (
                          <option key={sub._id} value={sub._id}>  ↳ {sub.name}</option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              <div className="abe-row">
                <label className="abe-label">Author</label>
                <input
                  type="text"
                  name="author"
                  className="abe-input"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Author name"
                />
              </div>

              <div className="abe-row">
                <label className="abe-label">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="abe-input"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="fashion, style, trends"
                />
              </div>

              <div className="abe-row">
                <label className="abe-label">Video URL (YouTube)</label>
                <input
                  type="text"
                  name="videoUrl"
                  className="abe-input"
                  value={form.videoUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="abe-buttons">
              <button
                type="button"
                className="abe-btn abe-btn-draft"
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                💾 Save as Draft
              </button>
              <button
                type="button"
                className="abe-btn abe-btn-update"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Update Blog"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}