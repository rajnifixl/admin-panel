"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

// Type definitions
interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: string
  percentage?: number
  flatAmount?: number
  minimumOrder?: number
  maxDiscount?: number
  expiry: string
  usageLimit?: number
  usageCount?: number
  isFirstOrderOnly?: boolean
  buyQuantity?: number
  freeQuantity?: number
  active?: boolean
}

interface FormData {
  code: string
  description: string
  discountType: string
  percentage: number
  flatAmount: number
  minimumOrder: number
  maxDiscount: string | number
  expiry: string
  usageLimit: string | number
  isFirstOrderOnly: boolean
  buyQuantity: string | number
  freeQuantity: string | number
}

interface FormErrors {
  [key: string]: string
}

interface ApiResponse {
  success: boolean
  message?: string
  coupons?: Coupon[]
  errors?: string[]
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    code: "",
    description: "",
    discountType: "percentage",
    percentage: 0,
    flatAmount: 0,
    minimumOrder: 0,
    maxDiscount: "",
    expiry: "",
    usageLimit: "",
    isFirstOrderOnly: false,
    buyQuantity: "",
    freeQuantity: "",
  })

  useEffect(() => { fetchCoupons() }, [])

  const fetchCoupons = async () => {
    try {
      console.log('🔄 Fetching coupons...')
      const token = localStorage.getItem("adminToken")
      
      if (!token) {
        console.error('❌ No admin token found')
        toast.error("Authentication required")
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/coupon/list`, {
        headers: { token }
      })
      
      console.log('📥 Fetch response status:', response.status)
      
      const data = await response.json()
      
      console.log('📥 Fetch response data:', data)
      
      if (data.success) {
        console.log('✅ Coupons fetched successfully:', data.coupons.length, 'coupons')
        setCoupons(data.coupons)
      } else {
        console.error('❌ Failed to fetch coupons:', data.message)
        toast.error("Failed to load coupons")
      }
    } catch (error) {
      console.error('❌ Error fetching coupons:', error)
      toast.error("Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Validate form data before submission
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Code validation
    if (!formData.code.trim()) {
      errors.code = "Coupon code is required"
    } else if (formData.code.length < 3) {
      errors.code = "Code must be at least 3 characters"
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      errors.code = "Code must contain only uppercase letters and numbers"
    }

    // Check for duplicate code (only if creating new coupon)
    if (!editingCoupon && coupons.some((c: Coupon) => c.code === formData.code.toUpperCase())) {
      errors.code = "This coupon code already exists"
    }

    // Expiry validation
    if (!formData.expiry) {
      errors.expiry = "Expiry date is required"
    } else if (new Date(formData.expiry) <= new Date()) {
      errors.expiry = "Expiry date must be in the future"
    }

    // Discount type specific validation
    switch (formData.discountType) {
      case 'percentage':
        if (!formData.percentage || formData.percentage <= 0 || formData.percentage > 100) {
          errors.percentage = "Percentage must be between 1 and 100"
        }
        break
      case 'flat':
        if (!formData.flatAmount || formData.flatAmount <= 0) {
          errors.flatAmount = "Discount amount must be greater than 0"
        }
        break
      case 'minimumOrder':
        if (!formData.minimumOrder || formData.minimumOrder <= 0) {
          errors.minimumOrder = "Minimum order must be greater than 0"
        }
        if (!formData.flatAmount || formData.flatAmount <= 0) {
          errors.flatAmount = "Discount amount must be greater than 0"
        }
        break
      case 'buyXGetY':
        if (!formData.buyQuantity || Number(formData.buyQuantity) < 1) {
          errors.buyQuantity = "Buy quantity must be at least 1"
        }
        if (!formData.freeQuantity || Number(formData.freeQuantity) < 1) {
          errors.freeQuantity = "Free quantity must be at least 1"
        }
        break
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    // ✅ Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      
      // ✅ DEBUG: Log token and coupon ID
      console.log('🔐 Token exists:', !!token)
      console.log('📝 Editing coupon:', editingCoupon)
      console.log('📝 Coupon ID:', editingCoupon?._id)
      
      const url = editingCoupon
        ? `${BACKEND_URL}/api/coupon/${editingCoupon._id}`
        : `${BACKEND_URL}/api/coupon/create`
      const method = editingCoupon ? "PUT" : "POST"

      // ✅ DEBUG: Log URL and method
      console.log('🔗 API URL:', url)
      console.log('📤 Method:', method)

      // ✅ FIX: Build submitData with ONLY the fields that apply to this discount type
      // This prevents sending undefined values which can cause MongoDB update issues
      const submitData: Record<string, any> = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        minimumOrder: parseFloat(String(formData.minimumOrder)) || 0,
        isFirstOrderOnly: formData.isFirstOrderOnly,
        expiry: formData.expiry,
      }

      // ✅ Add discount type specific fields ONLY
      switch (formData.discountType) {
        case 'percentage':
          submitData.percentage = parseFloat(String(formData.percentage))
          if (formData.maxDiscount) {
            submitData.maxDiscount = parseFloat(String(formData.maxDiscount))
          }
          break
        case 'flat':
          submitData.flatAmount = parseFloat(String(formData.flatAmount))
          if (formData.maxDiscount) {
            submitData.maxDiscount = parseFloat(String(formData.maxDiscount))
          }
          break
        case 'minimumOrder':
          submitData.flatAmount = parseFloat(String(formData.flatAmount))
          if (formData.maxDiscount) {
            submitData.maxDiscount = parseFloat(String(formData.maxDiscount))
          }
          break
        case 'buyXGetY':
          submitData.buyQuantity = parseInt(String(formData.buyQuantity))
          submitData.freeQuantity = parseInt(String(formData.freeQuantity))
          break
        case 'freeDelivery':
          submitData.freeDelivery = true
          break
      }

      // ✅ Add optional fields if provided
      if (formData.usageLimit) {
        submitData.usageLimit = parseInt(String(formData.usageLimit))
      }

      // ✅ DEBUG: Log form data
      console.log('📋 Form data:', formData)
      console.log('📤 Submit data (CLEAN):', submitData)

      // ✅ Check if token exists
      if (!token) {
        console.error('❌ No admin token found in localStorage')
        toast.error("Authentication required. Please login again.")
        return
      }

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json", 
          token: token
        },
        body: JSON.stringify(submitData),
      })

      // ✅ DEBUG: Log response status
      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      const data: ApiResponse = await response.json()

      // ✅ DEBUG: Log response data
      console.log('📥 Response data:', data)

      if (data.success) {
        toast.success(editingCoupon ? "✅ Coupon updated!" : "✅ Coupon created!")
        console.log('✅ Success! Closing modal and refreshing list...')
        setShowModal(false)
        resetForm()
        fetchCoupons()
      } else {
        // ✅ Show backend validation errors
        console.error('❌ API returned error:', data)
        if (data.errors && Array.isArray(data.errors)) {
          toast.error(data.errors[0] || data.message || "Failed to save coupon")
        } else {
          toast.error(data.message || "Failed to save coupon")
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error('❌ Error saving coupon:', error)
      console.error('❌ Error details:', errorMessage)
      toast.error("Failed to save coupon: " + errorMessage)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Delete this coupon?")) return
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/coupon/${id}`, {
        method: "DELETE", headers: { token: token || "" }
      })
      const data: ApiResponse = await response.json()
      if (data.success) { toast.success("✅ Deleted!"); fetchCoupons() }
      else toast.error(data.message || "Failed to delete")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error("Failed to delete: " + errorMessage)
    }
  }

  const handleToggleStatus = async (coupon: Coupon): Promise<void> => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/coupon/${coupon._id}/toggle`, {
        method: "PATCH", headers: { token: token || "" }
      })
      const data: ApiResponse = await response.json()
      if (data.success) { toast.success("✅ Status updated!"); fetchCoupons() }
      else toast.error(data.message || "Failed to toggle")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error("Failed to toggle: " + errorMessage)
    }
  }

  const openEditModal = (coupon: Coupon): void => {
    console.log('📝 Opening edit modal for coupon:', coupon)
    console.log('📝 Coupon ID:', coupon._id)
    console.log('📝 Coupon data:', JSON.stringify(coupon, null, 2))
    
    // ✅ FIX: Properly format date for HTML date input (YYYY-MM-DD)
    let formattedExpiry = ""
    if (coupon.expiry) {
      const expiryDate = new Date(coupon.expiry)
      // Format as YYYY-MM-DD for HTML date input
      formattedExpiry = expiryDate.toISOString().split('T')[0]
      console.log('📝 Coupon expiry (formatted):', formattedExpiry)
    }

    // ✅ FIX: Ensure all fields are loaded with proper defaults
    // CRITICAL: Use actual values from database, not 0 as default
    setEditingCoupon(coupon)
    setFormErrors({})
    
    const loadedFormData: FormData = {
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      // ✅ FIX: Load actual values from database, not 0
      percentage: coupon.percentage ?? 0,
      flatAmount: coupon.flatAmount ?? 0,
      minimumOrder: coupon.minimumOrder ?? 0,
      maxDiscount: coupon.maxDiscount ?? "",
      expiry: formattedExpiry,
      usageLimit: coupon.usageLimit ?? "",
      isFirstOrderOnly: coupon.isFirstOrderOnly || false,
      buyQuantity: coupon.buyQuantity ?? "",
      freeQuantity: coupon.freeQuantity ?? "",
    }
    
    setFormData(loadedFormData)
    
    console.log('✅ Form data loaded for editing:', {
      discountType: coupon.discountType,
      percentage: coupon.percentage,
      flatAmount: coupon.flatAmount,
      minimumOrder: coupon.minimumOrder,
      maxDiscount: coupon.maxDiscount,
      buyQuantity: coupon.buyQuantity,
      freeQuantity: coupon.freeQuantity,
    })
    setShowModal(true)
  }

  const resetForm = (): void => {
    setEditingCoupon(null)
    setFormErrors({})
    setFormData({
      code: "", description: "", discountType: "percentage", percentage: 0, flatAmount: 0,
      minimumOrder: 0, maxDiscount: "", expiry: "", usageLimit: "",
      isFirstOrderOnly: false, buyQuantity: "", freeQuantity: "",
    })
  }

  const formatDate = (d: string): string => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const isExpired = (d: string): boolean => new Date() > new Date(d)

  // ✅ FIX: Safe rendering with fallback values
  const getTypeLabel = (coupon: Coupon): string => {
    try {
      switch (coupon.discountType) {
        case 'percentage':
          return `${coupon.percentage || 0}% OFF`
        case 'flat':
          return `₹${coupon.flatAmount || 0} OFF`
        case 'freeDelivery':
          return '🚚 Free Delivery'
        case 'buyXGetY':
          return `🎁 Buy ${coupon.buyQuantity || 0} Get ${coupon.freeQuantity || 0} Free`
        case 'minimumOrder':
          return `₹${coupon.flatAmount || 0} OFF (Min ₹${coupon.minimumOrder || 0})`
        case 'firstOrder':
          if (coupon.percentage) return `${coupon.percentage}% OFF (First Order)`
          return `₹${coupon.flatAmount || 0} OFF (First Order)`
        case 'category':
          return `${coupon.percentage || 0}% OFF on ${coupon.description || 'Category'}`
        case 'product':
          return `${coupon.percentage || 0}% OFF on Product`
        default:
          return 'Special Offer'
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error('Error rendering coupon label:', errorMessage, coupon)
      return 'Special Offer'
    }
  }

  // Calculate stats
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter(c => c.active && !isExpired(c.expiry)).length
  const expiredCoupons = coupons.filter(c => isExpired(c.expiry)).length

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="gradient-text text-4xl font-bold">🎁 Coupon Management</h1>
          <button 
            className="btn-gradient flex items-center gap-2 px-6 py-3 text-white font-semibold"
            onClick={() => { resetForm(); setShowModal(true) }}
          >
            <Plus size={18} /> Add New Coupon
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card stat-card-blue p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Coupons</p>
                <p className="text-3xl font-bold text-blue-600">{totalCoupons}</p>
              </div>
              <div className="text-4xl opacity-20">📊</div>
            </div>
          </div>

          <div className="stat-card stat-card-emerald p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Coupons</p>
                <p className="text-3xl font-bold text-emerald-600">{activeCoupons}</p>
              </div>
              <div className="text-4xl opacity-20">✅</div>
            </div>
          </div>

          <div className="stat-card stat-card-orange p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Expired Coupons</p>
                <p className="text-3xl font-bold text-red-600">{expiredCoupons}</p>
              </div>
              <div className="text-4xl opacity-20">⏰</div>
            </div>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="card-premium p-6">
          {loading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="animate-pulse">Loading coupons...</div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">No coupons found. Create your first coupon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon: Coupon) => (
                <div 
                  key={coupon._id}
                  className={`card-premium p-6 transition-all ${!coupon.active ? 'opacity-60' : ''} ${isExpired(coupon.expiry) ? 'border-red-200 bg-red-50' : ''}`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-lg mb-2">
                        {coupon.code}
                      </div>
                      <div className="mt-2">
                        {isExpired(coupon.expiry) ? (
                          <span className="badge-danger">Expired</span>
                        ) : coupon.active ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-info">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-600">{getTypeLabel(coupon)}</div>
                      <div className="text-xs text-gray-500 uppercase mt-1">{coupon.discountType}</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {coupon.description && <div className="flex justify-between"><span>Description:</span><span className="font-medium">{coupon.description}</span></div>}
                    <div className="flex justify-between"><span>Min Order:</span><span className="font-medium">₹{coupon.minimumOrder}</span></div>
                    {coupon.maxDiscount && <div className="flex justify-between"><span>Max Discount:</span><span className="font-medium">₹{coupon.maxDiscount}</span></div>}
                    {coupon.discountType === 'buyXGetY' && (
                      <div className="flex justify-between"><span>Deal:</span><span className="font-medium">Buy {coupon.buyQuantity} Get {coupon.freeQuantity} Free</span></div>
                    )}
                    <div className="flex justify-between"><span>Expiry:</span><span className="font-medium">{formatDate(coupon.expiry)}</span></div>
                    <div className="flex justify-between"><span>Usage:</span><span className="font-medium">{coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : '(Unlimited)'}</span></div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                    <button 
                      className="flex-1 btn-premium bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-3 flex items-center justify-center gap-2"
                      onClick={() => handleToggleStatus(coupon)} 
                      title="Toggle Status"
                    >
                      {coupon.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      <span className="text-xs font-medium">Toggle</span>
                    </button>
                    <button 
                      className="flex-1 btn-premium bg-amber-50 text-amber-600 hover:bg-amber-100 py-2 px-3 flex items-center justify-center gap-2"
                      onClick={() => openEditModal(coupon)} 
                      title="Edit"
                    >
                      <Edit size={16} />
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button 
                      className="flex-1 btn-premium bg-red-50 text-red-600 hover:bg-red-100 py-2 px-3 flex items-center justify-center gap-2"
                      onClick={() => handleDelete(coupon._id)} 
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="glass-effect rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button 
                className="btn-premium bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Coupon Code */}
              <div className="form-group">
                <label className="form-label">Coupon Code *</label>
                <input 
                  type="text" 
                  className={`form-input ${formErrors.code ? 'border-red-500 bg-red-50' : ''}`}
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20" 
                  required 
                  style={{ textTransform: 'uppercase' }} 
                />
                {formErrors.code && <div className="text-red-600 text-sm mt-1">{formErrors.code}</div>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Get 20% off on all orders" 
                />
              </div>

              {/* Discount Type */}
              <div className="form-group">
                <label className="form-label">Discount Type *</label>
                <select 
                  className="form-select"
                  value={formData.discountType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, discountType: e.target.value })}
                >
                  <option value="percentage">📊 Percentage Off (e.g., 20% off)</option>
                  <option value="flat">💰 Flat Amount Off (e.g., ₹100 off)</option>
                  <option value="freeDelivery">🚚 Free Delivery</option>
                  <option value="buyXGetY">🎁 Buy X Get Y Free</option>
                  <option value="minimumOrder">🛒 Minimum Order Discount</option>
                </select>
              </div>

              {/* Buy X Get Y fields */}
              {formData.discountType === 'buyXGetY' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <strong className="text-blue-900">Buy X Get Y Free</strong>
                  <p className="text-sm text-blue-800 mt-1">Customer buys X items, gets Y items free</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="form-group">
                      <label className="form-label">Buy X (items) *</label>
                      <input 
                        type="number" 
                        className={`form-input ${formErrors.buyQuantity ? 'border-red-500 bg-red-50' : ''}`}
                        value={formData.buyQuantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || "" })}
                        placeholder="e.g., 2" 
                        min="1" 
                        required 
                      />
                      {formErrors.buyQuantity && <div className="text-red-600 text-sm mt-1">{formErrors.buyQuantity}</div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Get Y Free (items) *</label>
                      <input 
                        type="number" 
                        className={`form-input ${formErrors.freeQuantity ? 'border-red-500 bg-red-50' : ''}`}
                        value={formData.freeQuantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, freeQuantity: parseInt(e.target.value) || "" })}
                        placeholder="e.g., 1" 
                        min="1" 
                        required 
                      />
                      {formErrors.freeQuantity && <div className="text-red-600 text-sm mt-1">{formErrors.freeQuantity}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Minimum Order Discount info */}
              {formData.discountType === 'minimumOrder' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <strong className="text-blue-900">Minimum Order Discount</strong>
                  <p className="text-sm text-blue-800 mt-1">Flat discount when order exceeds minimum amount. Set Min Order below + Discount Value.</p>
                </div>
              )}

              {/* Value field - hide for buyXGetY and freeDelivery */}
              {formData.discountType !== 'buyXGetY' && formData.discountType !== 'freeDelivery' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      {formData.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'} *
                    </label>
                    <input 
                      type="number" 
                      className={`form-input ${formErrors.percentage || formErrors.flatAmount ? 'border-red-500 bg-red-50' : ''}`}
                      value={formData.discountType === 'percentage' ? formData.percentage : formData.flatAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (formData.discountType === 'percentage') {
                          setFormData({ ...formData, percentage: val });
                        } else {
                          setFormData({ ...formData, flatAmount: val });
                        }
                      }}
                      min="0" 
                      required 
                    />
                    {(formErrors.percentage || formErrors.flatAmount) && <div className="text-red-600 text-sm mt-1">{formErrors.percentage || formErrors.flatAmount}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Order Amount (₹)</label>
                    <input 
                      type="number" 
                      className={`form-input ${formErrors.minimumOrder ? 'border-red-500 bg-red-50' : ''}`}
                      value={formData.minimumOrder}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) || 0 })}
                      min="0" 
                    />
                    {formErrors.minimumOrder && <div className="text-red-600 text-sm mt-1">{formErrors.minimumOrder}</div>}
                  </div>
                </div>
              )}

              {/* Max discount - only for percentage */}
              {formData.discountType === 'percentage' && (
                <div className="form-group">
                  <label className="form-label">Max Discount Cap (₹) — Optional</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.maxDiscount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="e.g., 500 (max ₹500 discount)" 
                    min="0" 
                  />
                </div>
              )}

              {/* Expiry and Usage Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input 
                    type="date" 
                    className={`form-input ${formErrors.expiry ? 'border-red-500 bg-red-50' : ''}`}
                    value={formData.expiry}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expiry: e.target.value })}
                    required 
                  />
                  {formErrors.expiry && <div className="text-red-600 text-sm mt-1">{formErrors.expiry}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Usage Limit</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.usageLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Unlimited" 
                    min="1" 
                  />
                </div>
              </div>

              {/* First Order Only */}
              <div className="form-group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isFirstOrderOnly}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isFirstOrderOnly: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="form-label mb-0">First order only</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  className="btn-premium bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-gradient px-6 py-2"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
