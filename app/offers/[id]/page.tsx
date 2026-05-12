"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ImagePlus, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

interface Offer {
  _id?: string
  title: string
  description: string
  offerType: string
  buyQuantity?: number
  freeQuantity?: number
  discountType: string
  discountValue: number
  maxDiscount?: number
  minimumOrderValue: number
  applicableCategories: string[]
  applicableProducts: string[]
  excludedProducts: string[]
  startDate: string
  endDate: string
  bannerImage?: string
  bannerText: string
  backgroundColor: string
  textColor: string
  priority: number
  canStackWith: string[]
  maxStackableDiscounts: number
  usageLimit?: number
  isActive: boolean
}

const OFFER_TYPES = [
  { value: "buyXGetY", label: "Buy X Get Y" },
  { value: "flashSale", label: "Flash Sale" },
  { value: "festive", label: "Festive Sale" },
  { value: "categoryDiscount", label: "Category Discount" },
  { value: "productDiscount", label: "Product Discount" },
]

const CATEGORIES = ["Men", "Women", "Kids"]

export default function CreateEditOfferPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params.id as string
  const isEdit = offerId !== "create"

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Offer>({
    title: "",
    description: "",
    offerType: "flashSale",
    discountType: "percentage",
    discountValue: 0,
    minimumOrderValue: 0,
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    startDate: "",
    endDate: "",
    bannerText: "",
    backgroundColor: "#ff6b6b",
    textColor: "#ffffff",
    priority: 5,
    canStackWith: ["coupon"],
    maxStackableDiscounts: 3,
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }

    if (isEdit) {
      fetchOffer()
    }
  }, [router, isEdit])

  const fetchOffer = async () => {
    try {
      const data = await authFetch(`/api/offer/${offerId}`)

      if (data.success) {
        const offer = data.offer
        setForm({
          ...offer,
          startDate: new Date(offer.startDate).toISOString().slice(0, 16),
          endDate: new Date(offer.endDate).toISOString().slice(0, 16),
        })
        if (offer.bannerImage) {
          setBannerPreview(offer.bannerImage)
        }
      } else {
        toast.error(data.message || "Failed to fetch offer")
        router.push("/offers")
      }
    } catch (error) {
      console.error("Error fetching offer:", error)
      toast.error("Failed to fetch offer")
      router.push("/offers")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleCategoryToggle = (category: string) => {
    setForm(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(category)
        ? prev.applicableCategories.filter(c => c !== category)
        : [...prev.applicableCategories, category]
    }))
  }

  const handleStackingToggle = (type: string) => {
    setForm(prev => ({
      ...prev,
      canStackWith: prev.canStackWith.includes(type)
        ? prev.canStackWith.filter(t => t !== type)
        : [...prev.canStackWith, type]
    }))
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setBannerPreview(result)
      setForm(prev => ({
        ...prev,
        bannerImage: result
      }))
    }
    reader.readAsDataURL(file)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (form.discountValue <= 0) {
      newErrors.discountValue = "Discount value must be greater than 0"
    }

    if (!form.startDate) {
      newErrors.startDate = "Start date is required"
    }

    if (!form.endDate) {
      newErrors.endDate = "End date is required"
    }

    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }

    if (form.offerType === "categoryDiscount" && form.applicableCategories.length === 0) {
      newErrors.applicableCategories = "Select at least one category"
    }

    if (form.offerType === "buyXGetY") {
      if (!form.buyQuantity || form.buyQuantity < 1) {
        newErrors.buyQuantity = "Buy quantity must be at least 1"
      }
      if (!form.freeQuantity || form.freeQuantity < 1) {
        newErrors.freeQuantity = "Free quantity must be at least 1"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors")
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }

      const method = isEdit ? "PUT" : "POST"
      const endpoint = isEdit ? `/api/offer/${offerId}` : "/api/offer/create"

      const data = await authFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      if (data.success) {
        toast.success(isEdit ? "Offer updated successfully" : "Offer created successfully")
        router.push("/offers")
      } else {
        toast.error(data.message || "Failed to save offer")
      }
    } catch (error) {
      console.error("Error saving offer:", error)
      toast.error("Failed to save offer")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <style>{`
        .offer-form-page { font-family: 'Georgia', serif; }
        .offer-form-section { background: #fff; border: 1px solid #e8e4df; border-radius: 16px; padding: 28px; margin-bottom: 20px; }
        .offer-form-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #8b7355; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .offer-form-title::after { content: ''; flex: 1; height: 1px; background: #e8e4df; }
        .offer-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .offer-form-grid-full { grid-column: 1 / -1; }
        .offer-form-label { font-size: 12px; font-weight: 600; color: #6b5c48; letter-spacing: 0.3px; margin-bottom: 6px; display: block; }
        .offer-form-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; color: #2d2520; background: #faf8f5; outline: none; transition: all 0.2s; font-family: inherit; }
        .offer-form-input:focus { border-color: #8b7355; background: #fff; box-shadow: 0 0 0 3px rgba(139,115,85,0.1); }
        .offer-form-input.error { border-color: #ef4444; }
        .offer-form-error { font-size: 12px; color: #ef4444; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .offer-form-checkbox { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #faf8f5; border: 1.5px solid #e8e4df; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .offer-form-checkbox:hover { border-color: #8b7355; }
        .offer-form-checkbox input { width: 18px; height: 18px; accent-color: #8b7355; cursor: pointer; }
        .offer-form-checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .offer-form-color-input { width: 60px; height: 40px; border: 1.5px solid #e8e4df; border-radius: 8px; cursor: pointer; }
        .offer-form-submit { width: 100%; padding: 14px; background: #2d2520; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .offer-form-submit:hover:not(:disabled) { background: #1a1410; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,37,32,0.25); }
        .offer-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .offer-form-cancel { width: 100%; padding: 14px; background: transparent; color: #6b5c48; border: 1.5px solid #e8e4df; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .offer-form-cancel:hover { border-color: #8b7355; color: #8b7355; }
        .banner-preview { width: 100%; max-width: 300px; border-radius: 10px; margin-top: 12px; }
        .upload-zone { border: 2px dashed #d4c9bc; border-radius: 14px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: #faf8f5; }
        .upload-zone:hover { border-color: #8b7355; background: #f5f0ea; }
        @media (max-width: 768px) { .offer-form-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="offer-form-page max-w-3xl mx-auto pb-10">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link href="/offers">
            <button style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e8e4df", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b5c48" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#2d2520", margin: 0, letterSpacing: "-0.5px" }}>
              {isEdit ? "Edit Offer" : "Create New Offer"}
            </h1>
            <p style={{ fontSize: 13, color: "#9b8878", margin: 0, marginTop: 2 }}>
              {isEdit ? "Update offer details" : "Create a new promotional offer"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="offer-form-section">
            <div className="offer-form-title">Basic Information</div>

            <div className="offer-form-grid offer-form-grid-full">
              <div>
                <label className="offer-form-label">Offer Title *</label>
                <input
                  className={`offer-form-input ${errors.title ? "error" : ""}`}
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Summer Flash Sale"
                />
                {errors.title && <div className="offer-form-error"><AlertCircle size={12} /> {errors.title}</div>}
              </div>
            </div>

            <div className="offer-form-grid offer-form-grid-full">
              <div>
                <label className="offer-form-label">Description</label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the offer..."
                  style={{ minHeight: "80px", border: "1.5px solid #e8e4df", borderRadius: "10px", padding: "10px 14px", fontFamily: "inherit" }}
                />
              </div>
            </div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Offer Type *</label>
                <Select value={form.offerType} onValueChange={(v) => handleSelectChange("offerType", v)}>
                  <SelectTrigger style={{ border: "1.5px solid #e8e4df", background: "#faf8f5", borderRadius: 10 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="offer-form-label">Priority (1-10)</label>
                <input
                  className="offer-form-input"
                  name="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={form.priority}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Discount Details */}
          <div className="offer-form-section">
            <div className="offer-form-title">Discount Details</div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Discount Type *</label>
                <Select value={form.discountType} onValueChange={(v) => handleSelectChange("discountType", v)}>
                  <SelectTrigger style={{ border: "1.5px solid #e8e4df", background: "#faf8f5", borderRadius: 10 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="offer-form-label">Discount Value *</label>
                <input
                  className={`offer-form-input ${errors.discountValue ? "error" : ""}`}
                  name="discountValue"
                  type="number"
                  min="0"
                  value={form.discountValue}
                  onChange={handleChange}
                  placeholder="e.g., 20"
                />
                {errors.discountValue && <div className="offer-form-error"><AlertCircle size={12} /> {errors.discountValue}</div>}
              </div>
            </div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Maximum Discount Cap</label>
                <input
                  className="offer-form-input"
                  name="maxDiscount"
                  type="number"
                  min="0"
                  value={form.maxDiscount || ""}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="offer-form-label">Minimum Order Value</label>
                <input
                  className="offer-form-input"
                  name="minimumOrderValue"
                  type="number"
                  min="0"
                  value={form.minimumOrderValue}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            {form.offerType === "buyXGetY" && (
              <div className="offer-form-grid">
                <div>
                  <label className="offer-form-label">Buy Quantity *</label>
                  <input
                    className={`offer-form-input ${errors.buyQuantity ? "error" : ""}`}
                    name="buyQuantity"
                    type="number"
                    min="1"
                    value={form.buyQuantity || ""}
                    onChange={handleChange}
                  />
                  {errors.buyQuantity && <div className="offer-form-error"><AlertCircle size={12} /> {errors.buyQuantity}</div>}
                </div>

                <div>
                  <label className="offer-form-label">Free Quantity *</label>
                  <input
                    className={`offer-form-input ${errors.freeQuantity ? "error" : ""}`}
                    name="freeQuantity"
                    type="number"
                    min="1"
                    value={form.freeQuantity || ""}
                    onChange={handleChange}
                  />
                  {errors.freeQuantity && <div className="offer-form-error"><AlertCircle size={12} /> {errors.freeQuantity}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Applicability */}
          <div className="offer-form-section">
            <div className="offer-form-title">Applicability</div>

            {form.offerType === "categoryDiscount" && (
              <div className="offer-form-grid offer-form-grid-full">
                <div>
                  <label className="offer-form-label">Select Categories *</label>
                  <div className="offer-form-checkbox-group">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className="offer-form-checkbox">
                        <input
                          type="checkbox"
                          checked={form.applicableCategories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                  {errors.applicableCategories && <div className="offer-form-error"><AlertCircle size={12} /> {errors.applicableCategories}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Timing */}
          <div className="offer-form-section">
            <div className="offer-form-title">Timing</div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Start Date & Time *</label>
                <input
                  className={`offer-form-input ${errors.startDate ? "error" : ""}`}
                  name="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={handleChange}
                />
                {errors.startDate && <div className="offer-form-error"><AlertCircle size={12} /> {errors.startDate}</div>}
              </div>

              <div>
                <label className="offer-form-label">End Date & Time *</label>
                <input
                  className={`offer-form-input ${errors.endDate ? "error" : ""}`}
                  name="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={handleChange}
                />
                {errors.endDate && <div className="offer-form-error"><AlertCircle size={12} /> {errors.endDate}</div>}
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="offer-form-section">
            <div className="offer-form-title">Banner</div>

            <div className="offer-form-grid offer-form-grid-full">
              <div>
                <label className="offer-form-label">Banner Image</label>
                <div
                  className="upload-zone"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={32} style={{ margin: "0 auto", color: "#8b7355" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2520", margin: "8px 0 4px" }}>
                    Click to upload banner
                  </p>
                  <p style={{ fontSize: 12, color: "#9b8878", margin: 0 }}>
                    PNG, JPG up to 5MB
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleBannerUpload}
                  />
                </div>
                {bannerPreview && (
                  <img src={bannerPreview} alt="Banner preview" className="banner-preview" />
                )}
              </div>
            </div>

            <div className="offer-form-grid offer-form-grid-full">
              <div>
                <label className="offer-form-label">Banner Text</label>
                <input
                  className="offer-form-input"
                  name="bannerText"
                  value={form.bannerText}
                  onChange={handleChange}
                  placeholder="e.g., Limited Time Offer!"
                />
              </div>
            </div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Background Color</label>
                <input
                  type="color"
                  className="offer-form-color-input"
                  value={form.backgroundColor}
                  onChange={(e) => setForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                />
              </div>

              <div>
                <label className="offer-form-label">Text Color</label>
                <input
                  type="color"
                  className="offer-form-color-input"
                  value={form.textColor}
                  onChange={(e) => setForm(prev => ({ ...prev, textColor: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Stacking Rules */}
          <div className="offer-form-section">
            <div className="offer-form-title">Stacking Rules</div>

            <div className="offer-form-grid offer-form-grid-full">
              <div>
                <label className="offer-form-label">Can Stack With</label>
                <div className="offer-form-checkbox-group">
                  {["coupon", "productDiscount", "categoryDiscount", "flashSale", "deliveryDiscount"].map(type => (
                    <label key={type} className="offer-form-checkbox">
                      <input
                        type="checkbox"
                        checked={form.canStackWith.includes(type)}
                        onChange={() => handleStackingToggle(type)}
                      />
                      {type.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="offer-form-grid">
              <div>
                <label className="offer-form-label">Max Stackable Discounts</label>
                <input
                  className="offer-form-input"
                  name="maxStackableDiscounts"
                  type="number"
                  min="1"
                  value={form.maxStackableDiscounts}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="offer-form-label">Usage Limit</label>
                <input
                  className="offer-form-input"
                  name="usageLimit"
                  type="number"
                  min="1"
                  value={form.usageLimit || ""}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="offer-form-section">
            <label className="offer-form-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>Active</span>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <Link href="/offers">
              <button type="button" className="offer-form-cancel">Cancel</button>
            </Link>
            <button type="submit" className="offer-form-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {isEdit ? "Update Offer" : "Create Offer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
