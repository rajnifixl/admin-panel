"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function CreateBlogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/category/list`)
      const data = await response.json()
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories)
        setSelectedCategory({ _id: data.categories[0]._id, name: data.categories[0].name })
      } else {
        // Fallback if no categories
        setCategories([{ name: "Other", _id: "default", subcategories: [] }])
        setSelectedCategory({ name: "Other", _id: "default" })
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([{ name: "Other", _id: "default", subcategories: [] }])
      setSelectedCategory({ name: "Other", _id: "default" })
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find(c => c._id === catId)
    if (cat) {
      setSelectedCategory(cat)
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
  }

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
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

    setLoading(true)
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
      const response = await fetch(`${BACKEND_URL}/api/blog/create`, {
        method: "POST",
        headers: { token },
        body: formData
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(isDraft ? "Blog saved as draft" : "Blog published successfully!")
        router.push("/blogs")
      } else {
        toast.error(data.message || "Failed to create blog")
      }
    } catch (error) {
      console.error("Error creating blog:", error)
      toast.error("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <style>{`
        .abc-page { font-family: 'Georgia', serif; }
        .abc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .abc-title { font-size: 26px; font-weight: 700; color: #2d2520; margin: 0; }
        .abc-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 992px) { .abc-layout { grid-template-columns: 1fr; } }
        .abc-section { background: white; border: 1px solid #e8e4df; border-radius: 16px; padding: 24px; }
        .abc-section-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8b7355; margin-bottom: 20px; }
        .abc-label { font-size: 12px; font-weight: 600; color: #6b5c48; margin-bottom: 6px; display: block; }
        .abc-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; }
        .abc-input:focus { border-color: #8b7355; background: white; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .abc-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; resize: vertical; }
        .abc-textarea:focus { border-color: #8b7355; background: white; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .abc-row { margin-bottom: 16px; }
        .abc-upload-zone { border: 2px dashed #d4c9bc; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .abc-upload-zone:hover { border-color: #8b7355; background: #f5f0ea; }
        .abc-upload-icon { width: 48px; height: 48px; background: #f0ebe3; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .abc-preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
        .abc-preview-item { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 2px solid #e8e4df; }
        .abc-preview-item img { width: 100%; height: 100%; object-fit: cover; }
        .abc-remove-btn { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .abc-select { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; background: #faf8f5; outline: none; cursor: pointer; }
        .abc-select:focus { border-color: #8b7355; background: white; }
        .abc-buttons { display: flex; gap: 12px; margin-top: 24px; }
        .abc-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .abc-btn-publish { background: #2d2520; color: white; }
        .abc-btn-publish:hover:not(:disabled) { background: #1a1410; }
        .abc-btn-draft { background: #f0ebe3; color: #6b5c48; }
        .abc-btn-draft:hover:not(:disabled) { background: #e8e4df; }
        .abc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="abc-page max-w-5xl mx-auto pb-10">
        {/* Header */}
        <div className="abc-header">
          <Link href="/blogs">
            <button style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e8e4df", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b5c48" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 className="abc-title">Create New Blog</h1>
        </div>

        <div className="abc-layout">
          {/* Main Content */}
          <div className="abc-section">
            <div className="abc-section-title">Content</div>
            
            <div className="abc-row">
              <label className="abc-label">Title *</label>
              <input
                type="text"
                name="title"
                className="abc-input"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter blog title"
              />
            </div>

            <div className="abc-row">
              <label className="abc-label">Excerpt</label>
              <textarea
                name="excerpt"
                className="abc-textarea"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Brief description (optional)"
                rows={2}
              />
            </div>

            <div className="abc-row">
              <RichTextEditor
                label="Content (HTML supported)"
                value={form.content}
                onChange={(newValue) => setForm(prev => ({ ...prev, content: newValue }))}
                placeholder="Write your blog content here..."
                height={500}
                required
              />
            </div>

            <div className="abc-row">
              <label className="abc-label">Gallery Images (max 10)</label>
              <div
                className="abc-upload-zone"
                onClick={() => document.getElementById("gallery-input").click()}
              >
                <div className="abc-upload-icon">
                  <Upload size={22} color="#8b7355" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2520", margin: "0 0 4px" }}>
                  Click to upload gallery images
                </p>
                <p style={{ fontSize: 12, color: "#9b8878", margin: 0 }}>
                  PNG, JPG, WEBP • Max 10 images
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
              {galleryPreviews.length > 0 && (
                <div className="abc-preview-grid">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="abc-preview-item">
                      <img src={preview} alt={`Gallery ${index + 1}`} />
                      <button
                        type="button"
                        className="abc-remove-btn"
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
            <div className="abc-section">
              <div className="abc-section-title">Cover Image</div>
              <div
                className="abc-upload-zone"
                onClick={() => document.getElementById("cover-input").click()}
              >
                {coverImagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={coverImagePreview} alt="Cover" style={{ maxHeight: 150, borderRadius: 8 }} />
                    <button
                      type="button"
                      className="abc-remove-btn"
                      onClick={(e) => { e.stopPropagation(); removeCoverImage(); }}
                      style={{ position: "absolute", top: 4, right: 4 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="abc-upload-icon">
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

            <div className="abc-section" style={{ marginTop: 24 }}>
              <div className="abc-section-title">Details</div>

              <div className="abc-row">
                <label className="abc-label">Category</label>
                {categoriesLoading ? (
                  <div className="abc-select" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading...
                  </div>
                ) : (
                  <select
                    className="abc-select"
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
                    {categories.map(cat => (
                      <optgroup key={cat._id} label={cat.name}>
                        <option value={cat._id}>{cat.name}</option>
                        {cat.subcategories && cat.subcategories.map(sub => (
                          <option key={sub._id} value={sub._id}>  ↳ {sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>

              <div className="abc-row">
                <label className="abc-label">Author</label>
                <input
                  type="text"
                  name="author"
                  className="abc-input"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Author name"
                />
              </div>

              <div className="abc-row">
                <label className="abc-label">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="abc-input"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="fashion, style, trends"
                />
              </div>

              <div className="abc-row">
                <label className="abc-label">Video URL (YouTube)</label>
                <input
                  type="text"
                  name="videoUrl"
                  className="abc-input"
                  value={form.videoUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="abc-buttons">
              <button
                type="button"
                className="abc-btn abc-btn-draft"
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                💾 Save as Draft
              </button>
              <button
                type="button"
                className="abc-btn abc-btn-publish"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "🚀 Publish Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}