"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { PaymentOfferSection } from "@/components/PaymentOfferSection"
import { ArrowLeft, ImagePlus, X, GripVertical, Video, Loader2, CheckCircle2, Star, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"]

interface ImageItem { id: string; file: File; preview: string }
interface Category { _id: string; name: string; subCategories: string[] }

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Dynamic categories from API
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Initialize with empty string to avoid uncontrolled → controlled warning
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    stock: "",
    brand: "",
    sku: "",
    bestseller: false,
    paymentModeCOD: true,
    paymentModeOnline: false,
    // ✅ ADVANCED PAYMENT OFFER SYSTEM
    onlineDiscount: 0,
    offerLabel: "",
    discount: 0,
    discountStartDate: "",
    discountEndDate: "",
    // ✅ Buy X Get Y
    buyXGetYEnabled: false,
    buyQuantity: 1,
    getQuantity: 1,
    // ✅ Flash Sale
    flashSaleEnabled: false,
    flashSaleTitle: "Flash Sale",
    flashSaleEndTime: "",
    flashSaleDiscount: 0,
    // ✅ Category Discount
    categoryDiscountEnabled: false,
    categoryDiscountPercent: 0,
    // ✅ Festive Sale
    festiveSaleEnabled: false,
    festiveSaleTitle: "Festive Sale",
    festiveSaleDiscount: 0,
    festiveSaleEndDate: "",
  })

  // ✅ FIX 2: Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories on mount
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      console.log('📡 Fetching categories...')
      const data = await authFetch('/api/category/list');
      console.log('📡 Categories response:', data)
      
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories);
        // Set default category to first one
        setForm(prev => ({ ...prev, category: data.categories[0].name }));
        setSubCategories(data.categories[0].subCategories || []);
      } else {
        // Fallback if no categories
        console.warn('⚠️ No categories from API, using fallback')
        const fallbackCategories = [
          { _id: '1', name: 'Men', subCategories: ['Topwear', 'Bottomwear', 'Winterwear'] },
          { _id: '2', name: 'Women', subCategories: ['Topwear', 'Bottomwear', 'Ethnic'] },
          { _id: '3', name: 'Kids', subCategories: ['Clothing', 'Toys'] },
        ];
        setCategories(fallbackCategories);
        setForm(prev => ({ ...prev, category: fallbackCategories[0].name }));
        setSubCategories(fallbackCategories[0].subCategories || []);
      }
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err);
      toast.error("Failed to load categories");
      // Fallback
      const fallbackCategories = [
        { _id: '1', name: 'Men', subCategories: ['Topwear', 'Bottomwear', 'Winterwear'] },
        { _id: '2', name: 'Women', subCategories: ['Topwear', 'Bottomwear', 'Ethnic'] },
        { _id: '3', name: 'Kids', subCategories: ['Clothing', 'Toys'] },
      ];
      setCategories(fallbackCategories);
    } finally {
      setCategoriesLoading(false)
    }
  };

  // ✅ FIX 3: Handle category change with proper state update
  const handleCategoryChange = (categoryName: string) => {
    setForm(prev => ({ ...prev, category: categoryName, subCategory: "" }));
    const category = categories.find(c => c.name === categoryName);
    setSubCategories(category?.subCategories || []);
    // Clear error
    if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
  };

  // Handle subcategory change
 const handleSubCategoryChange = (subCategory: string) => {
  setForm(prev => ({ ...prev, subCategory }))
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value 
    }))
    // Clear error
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  }

  const handleImages = (files: FileList | null) => {
    if (!files) return
    const remaining = 10 - images.length
    if (remaining <= 0) { toast.error("Maximum 10 images allowed"); return }
    const toProcess = Math.min(files.length, remaining)
    const newImages: ImageItem[] = []
    let processed = 0
    Array.from(files).slice(0, toProcess).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newImages.push({ id: Math.random().toString(36).slice(2), file, preview: e.target?.result as string })
        processed++
        if (processed === toProcess) setImages(prev => [...prev, ...newImages])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id))

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDropIndex(index) }
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newImages = [...images]
    const [dragged] = newImages.splice(dragIndex, 1)
    newImages.splice(index, 0, dragged)
    setImages(newImages)
    setDragIndex(null); setDropIndex(null)
  }

  const handleVideo = (file: File | null) => {
    setVideo(file)
    setVideoPreview(file ? URL.createObjectURL(file) : null)
  }

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])
    if (errors.sizes) setErrors(prev => ({ ...prev, sizes: "" }));
  }

  // ✅ FIX 4: Comprehensive validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.name.trim()) {
      newErrors.name = "Product name is required"
    }
    
    if (!form.price || Number(form.price) <= 0) {
      newErrors.price = "Valid price is required"
    }
    
    // Validate category is selected
    if (!form.category || form.category === "") {
      newErrors.category = "Please select a category"
    }
    
    // ✅ FIX: Validate subcategory is selected and is a valid value
    if (!form.subCategory || form.subCategory.trim() === "") {
      newErrors.subCategory = "Please select a subcategory"
    } else {
      // Validate that subCategory is one of the valid values
      const validSubCategories = ['Topwear', 'Bottomwear', 'Winterwear', 'Ethnic', 'Clothing', 'Toys']
      if (!validSubCategories.includes(form.subCategory.trim())) {
        newErrors.subCategory = "Invalid subcategory selected"
      }
    }
    
    if (selectedSizes.length === 0) {
      newErrors.sizes = "Select at least one size"
    }
    
    if (images.length === 0) {
      newErrors.images = "At least one image is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    toast.error("Please fill in all required fields")
    return
  }

  setSubmitting(true)

  try {
    const formData = new FormData()

    // ✅ Append all fields
    formData.append("name", form.name.trim())
    formData.append("description", form.description)
    formData.append("price", form.price)
    formData.append("category", form.category.trim())
    // ✅ FIX: Ensure subCategory is trimmed and valid
    formData.append("subCategory", form.subCategory.trim())
    formData.append("type", form.category.toLowerCase())
    formData.append("bestseller", String(form.bestseller))
    formData.append("sizes", JSON.stringify(selectedSizes))
    formData.append("stock", form.stock || "0")
    formData.append("brand", form.brand)
    formData.append("sku", form.sku)
    
    // ✅ Convert checkbox states to paymentMode string for backend compatibility
    let paymentMode = "both"
    if (form.paymentModeCOD && !form.paymentModeOnline) {
      paymentMode = "cod"
    } else if (!form.paymentModeCOD && form.paymentModeOnline) {
      paymentMode = "online"
    } else if (form.paymentModeCOD && form.paymentModeOnline) {
      paymentMode = "both"
    }
    formData.append("paymentMode", paymentMode)

    // ✅ ADVANCED PAYMENT OFFER SYSTEM
    formData.append("paymentOptionsCOD", String(form.paymentModeCOD))
    formData.append("paymentOptionsOnline", String(form.paymentModeOnline))
    formData.append("onlineDiscount", String(form.onlineDiscount))
    formData.append("offerLabel", form.offerLabel)

    // optional fields
    formData.append("discount", String(form.discount))
    if (form.discountStartDate) formData.append("discountStartDate", form.discountStartDate)
    if (form.discountEndDate) formData.append("discountEndDate", form.discountEndDate)

    // ✅ Buy X Get Y
    formData.append("buyXGetYEnabled", String(form.buyXGetYEnabled))
    formData.append("buyQuantity", String(form.buyQuantity))
    formData.append("getQuantity", String(form.getQuantity))

    // ✅ Flash Sale
    formData.append("flashSaleEnabled", String(form.flashSaleEnabled))
    formData.append("flashSaleTitle", form.flashSaleTitle)
    if (form.flashSaleEndTime) formData.append("flashSaleEndTime", form.flashSaleEndTime)
    formData.append("flashSaleDiscount", String(form.flashSaleDiscount))

    // ✅ Category Discount
    formData.append("categoryDiscountEnabled", String(form.categoryDiscountEnabled))
    formData.append("categoryDiscountPercent", String(form.categoryDiscountPercent))

    // ✅ Festive Sale
    formData.append("festiveSaleEnabled", String(form.festiveSaleEnabled))
    formData.append("festiveSaleTitle", form.festiveSaleTitle)
    formData.append("festiveSaleDiscount", String(form.festiveSaleDiscount))
    if (form.festiveSaleEndDate) formData.append("festiveSaleEndDate", form.festiveSaleEndDate)

    // ✅ Images
    images.forEach((img) => {
      formData.append("images", img.file)
    })

    // ✅ Video
    if (video) {
      formData.append("video", video)
    }

    // ✅ DEBUG (IMPORTANT)
    console.log("📤 Sending FormData:")
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1])
    }

    const token = localStorage.getItem("adminToken")

    const response = await fetch("http://localhost:5000/api/product/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ FIXED (only this)
      },
      body: formData,
    })

    const data = await response.json()

    console.log("📥 Response:", data)

    if (response.ok && data.success) {
      toast.success("Product added successfully!")
      // ✅ FIX: Add refresh parameter to trigger products list refresh
      router.push("/products?refresh=" + Date.now())
    } else {
      console.error("❌ Backend error:", data)
      toast.error(data.message || "Failed to add product")
    }

  } catch (err: any) {
    console.error("❌ Submit error:", err)
    toast.error("Server error. Check backend logs.")
  } finally {
    setSubmitting(false)
  }
}

  return (
    <AdminLayout>
      <style>{`
        .ap-page { font-family: 'Georgia', serif; }
        .ap-section { background: #fff; border: 1px solid #e8e4df; border-radius: 16px; padding: 28px; margin-bottom: 20px; }
        .ap-section-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8b7355; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .ap-section-title::after { content: ''; flex: 1; height: 1px; background: #e8e4df; }
        .ap-upload-zone { border: 2px dashed #d4c9bc; border-radius: 14px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .ap-upload-zone:hover, .ap-upload-zone.drag-over { border-color: #8b7355; background: #f5f0ea; }
        .ap-upload-icon { width: 48px; height: 48px; background: #f0ebe3; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .ap-img-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
        .ap-img-item { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 2px solid #e8e4df; transition: all 0.2s; cursor: grab; }
        .ap-img-item:active { cursor: grabbing; }
        .ap-img-item.is-drop { border-color: #8b7355; transform: scale(1.03); box-shadow: 0 4px 16px rgba(139,115,85,0.2); }
        .ap-img-item img { width: 100%; height: 100%; object-fit: cover; }
        .ap-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.2s; display: flex; align-items: flex-start; justify-content: space-between; padding: 6px; }
        .ap-img-item:hover .ap-img-overlay { background: rgba(0,0,0,0.25); }
        .ap-img-remove { width: 22px; height: 22px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .ap-img-item:hover .ap-img-remove { opacity: 1; }
        .ap-img-drag { opacity: 0; transition: opacity 0.2s; color: white; }
        .ap-img-item:hover .ap-img-drag { opacity: 1; }
        .ap-main-badge { position: absolute; bottom: 6px; left: 6px; background: #8b7355; color: white; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }
        .ap-num-badge { position: absolute; top: 6px; left: 6px; width: 20px; height: 20px; background: rgba(0,0,0,0.5); color: white; font-size: 10px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .ap-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; color: #2d2520; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; }
        .ap-input:focus { border-color: #8b7355; background: #fff; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .ap-input.error { border-color: #ef4444; }
        .ap-label { font-size: 12px; font-weight: 600; color: #6b5c48; letter-spacing: 0.3px; margin-bottom: 6px; display: block; }
        .ap-error { font-size: 12px; color: #ef4444; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .ap-size-btn { padding: 8px 18px; border: 1.5px solid #e8e4df; border-radius: 8px; background: #faf8f5; font-size: 13px; font-weight: 600; color: #6b5c48; cursor: pointer; transition: all 0.18s; font-family: inherit; }
        .ap-size-btn:hover { border-color: #8b7355; color: #8b7355; }
        .ap-size-btn.selected { background: #2d2520; border-color: #2d2520; color: white; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(45,37,32,0.2); }
        .ap-submit { width: 100%; padding: 14px; background: #2d2520; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .ap-submit:hover:not(:disabled) { background: #1a1410; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,37,32,0.25); }
        .ap-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .ap-cancel { width: 100%; padding: 14px; background: transparent; color: #6b5c48; border: 1.5px solid #e8e4df; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ap-cancel:hover { border-color: #8b7355; color: #8b7355; }
        .ap-bestseller { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fdf8f0; border: 1.5px solid #f0e6d0; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .ap-bestseller:hover { border-color: #d4a853; background: #fef5e0; }
        .ap-bestseller input { width: 18px; height: 18px; accent-color: #d4a853; cursor: pointer; }
        .ap-video-zone { border: 2px dashed #d4c9bc; border-radius: 14px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .ap-video-zone:hover { border-color: #8b7355; background: #f5f0ea; }
        .ap-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ap-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 640px) { .ap-img-grid { grid-template-columns: repeat(3, 1fr); } .ap-grid-2 { grid-template-columns: 1fr; } .ap-grid-4 { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="ap-page max-w-3xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products">
            <button style={{ width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e8e4df', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5c48' }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2d2520', margin: 0, letterSpacing: '-0.5px' }}>Add New Product</h1>
            <p style={{ fontSize: 13, color: '#9b8878', margin: 0, marginTop: 2 }}>Fill in the details below to list a new product</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* IMAGES */}
          <div className="ap-section">
            <div className="ap-section-title"><ImagePlus size={14} /> Product Images *</div>

            {errors.images && (
              <div className="ap-error mb-3" style={{ marginTop: 0, marginBottom: 12 }}>
                <AlertCircle size={12} /> {errors.images}
              </div>
            )}

            <div
              className={`ap-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => imageInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImages(e.dataTransfer.files) }}
            >
              <div className="ap-upload-icon">
                <ImagePlus size={22} color="#8b7355" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2520', margin: '0 0 4px' }}>
                Click to browse or drag & drop
              </p>
              <p style={{ fontSize: 12, color: '#9b8878', margin: 0 }}>
                Select multiple images at once • {images.length}/10 uploaded • First image = Main
              </p>
              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={e => handleImages(e.target.files)} />
            </div>

            {images.length > 0 && (
              <div className="ap-img-grid">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`ap-img-item ${dropIndex === index ? 'is-drop' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={() => { setDragIndex(null); setDropIndex(null) }}
                  >
                    <img src={img.preview} alt="" />
                    <div className="ap-img-overlay">
                      <GripVertical size={14} className="ap-img-drag" />
                      <button type="button" className="ap-img-remove" onClick={() => removeImage(img.id)}>
                        <X size={11} />
                      </button>
                    </div>
                    <div className="ap-num-badge">{index + 1}</div>
                    {index === 0 && <div className="ap-main-badge">Main</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIDEO */}
          <div className="ap-section">
            <div className="ap-section-title"><Video size={14} /> Product Video <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#b0a090', fontSize: 11 }}>(optional)</span></div>
            <div className="ap-video-zone" onClick={() => videoInputRef.current?.click()}>
              {videoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <video src={videoPreview} style={{ maxHeight: 160, borderRadius: 10 }} controls onClick={e => e.stopPropagation()} />
                  <button type="button" onClick={e => { e.stopPropagation(); handleVideo(null) }}
                    style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="ap-upload-icon"><Video size={20} color="#8b7355" /></div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2d2520', margin: '0 0 4px' }}>Upload product video</p>
                  <p style={{ fontSize: 12, color: '#9b8878', margin: 0 }}>MP4, MOV, AVI • Max 50MB</p>
                </>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={e => handleVideo(e.target.files?.[0] || null)} />
            </div>
          </div>

          {/* PRODUCT DETAILS */}
          <div className="ap-section">
            <div className="ap-section-title">Product Details</div>

            <div style={{ marginBottom: 16 }}>
              <label className="ap-label">Product Name *</label>
              <input 
                className={`ap-input ${errors.name ? 'error' : ''}`} 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="e.g., Cotton Summer T-Shirt" 
              />
              {errors.name && <div className="ap-error"><AlertCircle size={12} /> {errors.name}</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <RichTextEditor
                label="Description"
                value={form.description}
                onChange={(newValue) => setForm(prev => ({ ...prev, description: newValue }))}
                placeholder="Describe your product in detail..."
                height={300}
                error={errors.description}
              />
            </div>

            {/* Price Summary Section */}
            {form.price && (
              <div style={{
                background: '#fdf8f0',
                border: '1.5px solid #f0e6d0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8b7355', letterSpacing: '0.3px', marginBottom: 12, textTransform: 'uppercase' }}>
                  💰 Price Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b8878', marginBottom: 4 }}>Original Price</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2d2520' }}>₹{Number(form.price).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b8878', marginBottom: 4 }}>Discount</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: form.discount > 0 ? '#ef4444' : '#9b8878' }}>
                      {form.discount > 0 ? `-₹${Math.round(Number(form.price) * form.discount / 100).toLocaleString('en-IN')} (${form.discount}%)` : 'No discount'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 12, borderTop: '1px solid #e8e4df' }}>
                    <div style={{ fontSize: 11, color: '#9b8878', marginBottom: 4 }}>Final Price</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#2d2520' }}>
                      ₹{Math.round(Number(form.price) - (Number(form.price) * form.discount / 100)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="ap-grid-4" style={{ marginBottom: 16 }}>
              <div>
                <label className="ap-label">Price (₹) *</label>
                <input 
                  className={`ap-input ${errors.price ? 'error' : ''}`} 
                  name="price" 
                  type="number" 
                  value={form.price} 
                  onChange={handleChange} 
                  placeholder="499" 
                  min="0"
                  inputMode="decimal"
                  step="0.01"
                />
                {errors.price && <div className="ap-error"><AlertCircle size={12} /> {errors.price}</div>}
              </div>
              <div>
                <label className="ap-label">Discount (%)</label>
                <input 
                  className="ap-input" 
                  name="discount" 
                  type="number" 
                  value={form.discount} 
                  onChange={handleChange} 
                  placeholder="0" 
                  min="0" 
                  max="100"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="ap-label">Stock</label>
                <input 
                  className="ap-input" 
                  name="stock" 
                  type="number" 
                  value={form.stock} 
                  onChange={handleChange} 
                  placeholder="50" 
                  min="0"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="ap-label">Brand</label>
                <input 
                  className="ap-input" 
                  name="brand" 
                  value={form.brand} 
                  onChange={handleChange} 
                  placeholder="Nike"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Discount Date Range */}
            {form.discount > 0 && (
              <div className="ap-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="ap-label">Discount Start Date</label>
                  <input 
                    className="ap-input" 
                    name="discountStartDate" 
                    type="date" 
                    value={form.discountStartDate} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="ap-label">Discount End Date</label>
                  <input 
                    className="ap-input" 
                    name="discountEndDate" 
                    type="date" 
                    value={form.discountEndDate} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            )}

            <div className="ap-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label className="ap-label">SKU</label>
                <input 
                  className="ap-input" 
                  name="sku" 
                  value={form.sku} 
                  onChange={handleChange} 
                  placeholder="NK-001"
                  maxLength={50}
                />
              </div>
              <div></div>
            </div>

            <div className="ap-grid-2">
              {/* ✅ FIX 6: Category Select - NO empty value */}
              <div>
                <label className="ap-label">Category *</label>
                {categoriesLoading ? (
                  <div className="ap-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Loader2 size={16} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <Select 
                    value={form.category} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger 
                      className={errors.category ? 'error' : ''}
                      style={{ border: '1.5px solid #e8e4df', background: '#faf8f5', borderRadius: 10 }}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.category && <div className="ap-error"><AlertCircle size={12} /> {errors.category}</div>}
              </div>

              {/* ✅ FIX 7: SubCategory Select - NO empty value */}
              <div>
                <label className="ap-label">Sub Category *</label>
                <Select 
                  value={form.subCategory} 
                  onValueChange={handleSubCategoryChange}
                  disabled={!form.category}
                >
                  <SelectTrigger 
                    className={errors.subCategory ? 'error' : ''}
                    style={{ border: '1.5px solid #e8e4df', background: '#faf8f5', borderRadius: 10 }}
                  >
                    <SelectValue placeholder={!form.category ? "Select category first" : "Select subcategory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.length > 0 ? (
                      subCategories.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))
                    ) : (
                      // ✅ FIX: No SelectItem with empty value - use proper message
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No subcategories available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.subCategory && <div className="ap-error"><AlertCircle size={12} /> {errors.subCategory}</div>}
              </div>
            </div>
          </div>

          {/* SIZES */}
          <div className="ap-section">
            <div className="ap-section-title">Available Sizes *</div>
            
            {errors.sizes && (
              <div className="ap-error mb-3" style={{ marginTop: 0 }}>
                <AlertCircle size={12} /> {errors.sizes}
              </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIZES.map(size => (
                <button 
                  key={size} 
                  type="button" 
                  onClick={() => toggleSize(size)}
                  className={`ap-size-btn ${selectedSizes.includes(size) ? 'selected' : ''}`}
                >
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
<div className="ap-section">
  <div className="ap-section-title">Payment Options</div>

  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    
    {/* COD Checkbox */}
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: form.paymentModeCOD ? '#fdf8f0' : '#faf8f5',
      border: `1.5px solid ${form.paymentModeCOD ? '#f0e6d0' : '#e8e4df'}`,
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}>
      <input
        type="checkbox"
        checked={form.paymentModeCOD}
        onChange={(e) => setForm(prev => ({ ...prev, paymentModeCOD: e.target.checked }))}
        style={{
          width: '18px',
          height: '18px',
          accentColor: '#8b7355',
          cursor: 'pointer',
        }}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>💵 Cash on Delivery (COD)</div>
        <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>Customer pays when order is delivered</div>
      </div>
    </label>

    {/* Online Checkbox */}
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: form.paymentModeOnline ? '#fdf8f0' : '#faf8f5',
      border: `1.5px solid ${form.paymentModeOnline ? '#f0e6d0' : '#e8e4df'}`,
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}>
      <input
        type="checkbox"
        checked={form.paymentModeOnline}
        onChange={(e) => setForm(prev => ({ ...prev, paymentModeOnline: e.target.checked }))}
        style={{
          width: '18px',
          height: '18px',
          accentColor: '#8b7355',
          cursor: 'pointer',
        }}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>💳 Online Payment</div>
        <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>Credit/Debit card, UPI, and other digital methods</div>
      </div>
    </label>

    {/* Selected Options Display */}
    {(form.paymentModeCOD || form.paymentModeOnline) && (
      <div style={{
        marginTop: 8,
        padding: '10px 12px',
        background: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: 500,
      }}>
        ✓ Enabled: {[form.paymentModeCOD && 'COD', form.paymentModeOnline && 'Online'].filter(Boolean).join(' + ')}
      </div>
    )}

    {!form.paymentModeCOD && !form.paymentModeOnline && (
      <div style={{
        marginTop: 8,
        padding: '10px 12px',
        background: '#fff3e0',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        fontSize: 12,
        color: '#e65100',
        fontWeight: 500,
      }}>
        ⚠️ Select at least one payment option
      </div>
    )}

  </div>
</div>

          {/* ✅ ADVANCED PAYMENT OFFER SYSTEM */}
          <PaymentOfferSection form={form} setForm={setForm} errors={errors} />

          {/* ✅ BUY X GET Y OFFER */}
          <div className="ap-section">
            <div className="ap-section-title">🎁 Buy X Get Y Offer</div>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: form.buyXGetYEnabled ? '#fdf8f0' : '#faf8f5',
              border: `1.5px solid ${form.buyXGetYEnabled ? '#f0e6d0' : '#e8e4df'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={form.buyXGetYEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, buyXGetYEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#8b7355',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>Enable Buy X Get Y Offer</div>
                <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>e.g., Buy 2 Get 1 Free</div>
              </div>
            </label>

            {form.buyXGetYEnabled && (
              <div className="ap-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="ap-label">Buy Quantity *</label>
                  <input 
                    className="ap-input" 
                    type="number" 
                    value={form.buyQuantity} 
                    onChange={(e) => setForm(prev => ({ ...prev, buyQuantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    placeholder="2" 
                    min="1"
                  />
                </div>
                <div>
                  <label className="ap-label">Get Quantity *</label>
                  <input 
                    className="ap-input" 
                    type="number" 
                    value={form.getQuantity} 
                    onChange={(e) => setForm(prev => ({ ...prev, getQuantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    placeholder="1" 
                    min="1"
                  />
                </div>
              </div>
            )}

            {form.buyXGetYEnabled && (
              <div style={{
                padding: '12px 16px',
                background: '#e8f5e9',
                border: '1px solid #4caf50',
                borderRadius: '8px',
                fontSize: 13,
                color: '#2e7d32',
                fontWeight: 500,
              }}>
                ✓ Offer: Buy {form.buyQuantity} Get {form.getQuantity} Free
              </div>
            )}
          </div>

          {/* ✅ FLASH SALE / COUNTDOWN */}
          <div className="ap-section">
            <div className="ap-section-title">⚡ Flash Sale (Countdown)</div>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: form.flashSaleEnabled ? '#fdf8f0' : '#faf8f5',
              border: `1.5px solid ${form.flashSaleEnabled ? '#f0e6d0' : '#e8e4df'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={form.flashSaleEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, flashSaleEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#8b7355',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>Enable Flash Sale</div>
                <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>Show countdown timer on product</div>
              </div>
            </label>

            {form.flashSaleEnabled && (
              <>
                <div className="ap-grid-2" style={{ marginBottom: 16 }}>
                  <div>
                    <label className="ap-label">Flash Sale Title *</label>
                    <input 
                      className="ap-input" 
                      value={form.flashSaleTitle} 
                      onChange={(e) => setForm(prev => ({ ...prev, flashSaleTitle: e.target.value }))}
                      placeholder="Flash Sale" 
                    />
                  </div>
                  <div>
                    <label className="ap-label">Discount (%) *</label>
                    <input 
                      className="ap-input" 
                      type="number" 
                      value={form.flashSaleDiscount} 
                      onChange={(e) => setForm(prev => ({ ...prev, flashSaleDiscount: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                      placeholder="20" 
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="ap-label">Sale End Time *</label>
                  <input 
                    className="ap-input" 
                    type="datetime-local" 
                    value={form.flashSaleEndTime} 
                    onChange={(e) => setForm(prev => ({ ...prev, flashSaleEndTime: e.target.value }))}
                  />
                  <p style={{ fontSize: 11, color: '#9b8878', marginTop: 4, marginBottom: 0 }}>
                    Countdown timer will show on product card
                  </p>
                </div>

                {form.flashSaleEndTime && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#e8f5e9',
                    border: '1px solid #4caf50',
                    borderRadius: '8px',
                    fontSize: 13,
                    color: '#2e7d32',
                    fontWeight: 500,
                  }}>
                    ✓ {form.flashSaleTitle} - {form.flashSaleDiscount}% OFF until {new Date(form.flashSaleEndTime).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ✅ CATEGORY DISCOUNT */}
          <div className="ap-section">
            <div className="ap-section-title">📂 Category Discount</div>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: form.categoryDiscountEnabled ? '#fdf8f0' : '#faf8f5',
              border: `1.5px solid ${form.categoryDiscountEnabled ? '#f0e6d0' : '#e8e4df'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={form.categoryDiscountEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, categoryDiscountEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#8b7355',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>Enable Category Discount</div>
                <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>Apply discount to entire category</div>
              </div>
            </label>

            {form.categoryDiscountEnabled && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label className="ap-label">Discount Percentage (%) *</label>
                  <input 
                    className="ap-input" 
                    type="number" 
                    value={form.categoryDiscountPercent} 
                    onChange={(e) => setForm(prev => ({ ...prev, categoryDiscountPercent: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                    placeholder="15" 
                    min="0"
                    max="100"
                  />
                </div>

                {form.categoryDiscountPercent > 0 && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#e8f5e9',
                    border: '1px solid #4caf50',
                    borderRadius: '8px',
                    fontSize: 13,
                    color: '#2e7d32',
                    fontWeight: 500,
                  }}>
                    ✓ Category Discount: {form.categoryDiscountPercent}% OFF on all products in this category
                  </div>
                )}
              </>
            )}
          </div>

          {/* ✅ FESTIVE SALE */}
          <div className="ap-section">
            <div className="ap-section-title">🎉 Festive Sale</div>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: form.festiveSaleEnabled ? '#fdf8f0' : '#faf8f5',
              border: `1.5px solid ${form.festiveSaleEnabled ? '#f0e6d0' : '#e8e4df'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={form.festiveSaleEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, festiveSaleEnabled: e.target.checked }))}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#8b7355',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2520' }}>Enable Festive Sale</div>
                <div style={{ fontSize: 12, color: '#9b8878', marginTop: 2 }}>e.g., Diwali Sale, Christmas Sale</div>
              </div>
            </label>

            {form.festiveSaleEnabled && (
              <>
                <div className="ap-grid-2" style={{ marginBottom: 16 }}>
                  <div>
                    <label className="ap-label">Festive Sale Title *</label>
                    <input 
                      className="ap-input" 
                      value={form.festiveSaleTitle} 
                      onChange={(e) => setForm(prev => ({ ...prev, festiveSaleTitle: e.target.value }))}
                      placeholder="Diwali Sale" 
                    />
                  </div>
                  <div>
                    <label className="ap-label">Discount (%) *</label>
                    <input 
                      className="ap-input" 
                      type="number" 
                      value={form.festiveSaleDiscount} 
                      onChange={(e) => setForm(prev => ({ ...prev, festiveSaleDiscount: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                      placeholder="25" 
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="ap-label">Sale End Date *</label>
                  <input 
                    className="ap-input" 
                    type="date" 
                    value={form.festiveSaleEndDate} 
                    onChange={(e) => setForm(prev => ({ ...prev, festiveSaleEndDate: e.target.value }))}
                  />
                </div>

                {form.festiveSaleEndDate && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#e8f5e9',
                    border: '1px solid #4caf50',
                    borderRadius: '8px',
                    fontSize: 13,
                    color: '#2e7d32',
                    fontWeight: 500,
                  }}>
                    ✓ {form.festiveSaleTitle} - {form.festiveSaleDiscount}% OFF until {new Date(form.festiveSaleEndDate).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* BESTSELLER */}
          <div className="ap-section">
            <label className="ap-bestseller">
              <input 
                type="checkbox" 
                name="bestseller" 
                checked={form.bestseller} 
                onChange={handleChange} 
              />
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
            <Link href="/products">
              <button type="button" className="ap-cancel">Cancel</button>
            </Link>
            <button type="submit" className="ap-submit" disabled={submitting}>
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing...</>
                : <><CheckCircle2 size={16} /> Publish Product</>
              }
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}