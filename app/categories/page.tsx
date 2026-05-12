"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Edit2, 
  X, 
  Check, 
  Search,
  FolderTree,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

// Types
interface Category {
  _id: string
  name: string
  slug: string
  subCategories: string[]
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Response types
interface ApiResponse<T> {
  success: boolean
  message?: string
  category?: T
  categories?: T[]
  count?: number
}

export default function CategoriesPage() {
  const router = useRouter()
  
  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subCategories: [] as string[],
    description: "",
  })
  const [newSubCategory, setNewSubCategory] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching categories...')
      const data = await authFetch('/api/category/list')
      console.log('📡 Categories response:', data)
      
      if (data.success) {
        setCategories(data.categories || [])
        setTotalCount(data.categories?.length || 0)
      } else {
        toast.error(data.message || "Failed to fetch categories")
      }
    } catch (err: any) {
      console.error('❌ Fetch categories error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    fetchCategories()
  }, [router, fetchCategories])

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = "Category name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Category name must be at least 2 characters"
    } else if (formData.name.trim().length > 50) {
      errors.name = "Category name must be less than 50 characters"
    }
    
    // Check for duplicate name
    const duplicate = categories.find(
      cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
            cat._id !== selectedCategory?._id
    )
    if (duplicate) {
      errors.name = "A category with this name already exists"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add subcategory
  const addSubCategory = () => {
    const trimmed = newSubCategory.trim()
    if (trimmed && !formData.subCategories.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        subCategories: [...prev.subCategories, trimmed]
      }))
      setNewSubCategory("")
    }
  }

  // Remove subcategory
  const removeSubCategory = (sub: string) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => s !== sub)
    }))
  }

  // Handle add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      const data = await authFetch('/api/category/add', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          subCategories: formData.subCategories,
          description: formData.description.trim(),
        }),
      })

      if (data.success) {
        toast.success("Category created successfully!")
        closeDialogs()
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to create category")
      }
    } catch (err: any) {
      console.error('❌ Create category error:', err.message)
      toast.error(err.message || "Failed to create category")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle update category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCategory || !validateForm()) return
    
    setSubmitting(true)
    try {
      const data = await authFetch(`/api/category/update/${selectedCategory._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          subCategories: formData.subCategories,
          description: formData.description.trim(),
        }),
      })

      if (data.success) {
        toast.success("Category updated successfully!")
        closeDialogs()
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to update category")
      }
    } catch (err: any) {
      console.error('❌ Update category error:', err.message)
      toast.error(err.message || "Failed to update category")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return
    
    setSubmitting(true)
    try {
      const data = await authFetch(`/api/category/remove/${selectedCategory._id}`, {
        method: 'DELETE',
      })

      if (data.success) {
        toast.success("Category deleted successfully!")
        closeDialogs()
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to delete category")
      }
    } catch (err: any) {
      console.error('❌ Delete category error:', err.message)
      toast.error(err.message || "Failed to delete category")
    } finally {
      setSubmitting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      subCategories: [...(category.subCategories || [])],
      description: category.description || "",
    })
    setFormErrors({})
    setShowEditDialog(true)
  }

  // Open delete dialog
  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteDialog(true)
  }

  // Close all dialogs
  const closeDialogs = () => {
    setShowAddDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)
    setSelectedCategory(null)
    setFormData({ name: "", subCategories: [], description: "" })
    setNewSubCategory("")
    setFormErrors({})
  }

  // Reset add form
  const resetAddForm = () => {
    setFormData({ name: "", subCategories: [], description: "" })
    setNewSubCategory("")
    setFormErrors({})
    setShowAddDialog(true)
  }

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subCategories?.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Stats
  const stats = {
    total: categories.length,
    withSubcategories: categories.filter(c => c.subCategories && c.subCategories.length > 0).length,
    totalSubcategories: categories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0),
  }

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Categories</h1>
            <p className="text-gray-600 mt-1">Manage your product categories and subcategories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchCategories} className="btn-premium">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={resetAddForm} className="btn-gradient">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Categories</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <FolderTree className="h-12 w-12 text-blue-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-emerald">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">With Subcategories</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.withSubcategories}</p>
                </div>
                <FolderTree className="h-12 w-12 text-emerald-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-purple">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Subcategories</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalSubcategories}</p>
                </div>
                <FolderTree className="h-12 w-12 text-purple-500/20" />
              </div>
            </CardContent>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-premium"
          />
        </div>

        {/* Categories Table */}
        <Card className="card-premium">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <CardTitle className="text-lg font-bold text-gray-900">
              All Categories
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({filteredCategories.length} of {totalCount})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <FolderTree className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  {searchQuery ? "No categories found" : "No categories yet"}
                </p>
                <p className="text-sm">
                  {searchQuery ? "Try a different search term" : "Create your first category to get started"}
                </p>
                {!searchQuery && (
                  <Button onClick={resetAddForm} className="mt-4 btn-gradient">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="hidden md:table-cell">Subcategories</th>
                      <th className="hidden lg:table-cell">Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category._id} className="hover-lift">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <FolderTree className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{category.name}</p>
                              <p className="text-xs text-gray-500">/{category.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {category.subCategories && category.subCategories.length > 0 ? (
                              category.subCategories.slice(0, 3).map((sub) => (
                                <Badge key={sub} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {sub}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                            {category.subCategories && category.subCategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.subCategories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-sm text-gray-600 hidden lg:table-cell">
                          {new Date(category.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(category)}
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(category)}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Add New Category</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new product category with optional subcategories.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            {/* Category Name */}
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <Input
                placeholder="e.g., Men, Women, Kids"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }))
                }}
                className={`form-input ${formErrors.name ? 'border-red-500 bg-red-50' : ''}`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <Input
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
              />
            </div>

            {/* Subcategories */}
            <div className="form-group">
              <label className="form-label">Subcategories</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g., Topwear, Bottomwear"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSubCategory()
                    }
                  }}
                  className="flex-1 form-input"
                />
                <Button type="button" variant="outline" onClick={addSubCategory} className="btn-premium">
                  Add
                </Button>
              </div>
              
              {/* Subcategory tags */}
              {formData.subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.subCategories.map((sub) => (
                    <Badge key={sub} variant="secondary" className="gap-1 pl-2 bg-blue-50 text-blue-700 border-blue-200">
                      {sub}
                      <button
                        type="button"
                        onClick={() => removeSubCategory(sub)}
                        className="hover:text-red-600 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="btn-premium">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="btn-gradient">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Category</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the category name and subcategories.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            {/* Category Name */}
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <Input
                placeholder="e.g., Men, Women, Kids"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }))
                }}
                className={`form-input ${formErrors.name ? 'border-red-500 bg-red-50' : ''}`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <Input
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
              />
            </div>

            {/* Subcategories */}
            <div className="form-group">
              <label className="form-label">Subcategories</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g., Topwear, Bottomwear"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSubCategory()
                    }
                  }}
                  className="flex-1 form-input"
                />
                <Button type="button" variant="outline" onClick={addSubCategory} className="btn-premium">
                  Add
                </Button>
              </div>
              
              {/* Subcategory tags */}
              {formData.subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.subCategories.map((sub) => (
                    <Badge key={sub} variant="secondary" className="gap-1 pl-2 bg-blue-50 text-blue-700 border-blue-200">
                      {sub}
                      <button
                        type="button"
                        onClick={() => removeSubCategory(sub)}
                        className="hover:text-red-600 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="btn-premium">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="btn-gradient">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] glass-effect">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && selectedCategory.subCategories && selectedCategory.subCategories.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-red-900">This category has {selectedCategory.subCategories.length} subcategories:</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategory.subCategories.map((sub) => (
                  <Badge key={sub} variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                    {sub}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="btn-premium">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}