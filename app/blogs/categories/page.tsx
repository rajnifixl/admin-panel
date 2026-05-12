"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2, Loader2, X, Edit2, RotateCcw, FolderOpen, Folder } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function BlogCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newCategory, setNewCategory] = useState("")
  const [newSubcategory, setNewSubcategory] = useState("")
  const [subcategories, setSubcategories] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/category/list`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubcategory = () => {
    const trimmed = newSubcategory.trim()
    if (trimmed && !subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed])
      setNewSubcategory("")
    }
  }

  const handleRemoveSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSubcategory()
    }
  }

  const handleStartEdit = (cat) => {
    setEditing(true)
    setEditingId(cat._id)
    setNewCategory(cat.name)
    setSubcategories(cat.subcategories ? cat.subcategories.map(s => s.name) : [])
    setNewSubcategory("")
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditingId(null)
    setNewCategory("")
    setSubcategories([])
    setNewSubcategory("")
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    
    if (!newCategory.trim()) {
      toast.error("Category name is required")
      return
    }

    setAdding(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/category/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ 
          name: newCategory.trim(),
          subcategories: subcategories
        })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Category added successfully")
        setNewCategory("")
        setSubcategories([])
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to add category")
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to connect to server")
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    
    if (!newCategory.trim()) {
      toast.error("Category name is required")
      return
    }

    setAdding(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/category/update/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ 
          name: newCategory.trim(),
          subcategories: subcategories
        })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Category updated successfully")
        handleCancelEdit()
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to update category")
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to connect to server")
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${BACKEND_URL}/api/blog/category/remove/${id}`, {
        method: "DELETE",
        headers: { token }
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Category deleted successfully")
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to connect to server")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/blogs">
              <Button variant="outline" size="icon" className="border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 gradient-text">Blog Categories</h1>
              <p className="text-gray-600 mt-1">Organize your blog content with categories</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add/Edit Category Form */}
          <Card className="shadow-sm border-0 lg:col-span-1 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                {editing ? 'Edit Category' : 'Add New Category'}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {editing && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-800">Editing mode active. Make changes and save.</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={editing ? handleUpdateCategory : handleAddCategory}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Category Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    maxLength={50}
                    className="bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Subcategories (optional)</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add subcategory"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength={30}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
                    />
                    <Button 
                      type="button" 
                      size="icon"
                      onClick={handleAddSubcategory}
                      disabled={!newSubcategory.trim()}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {subcategories.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {subcategories.map((sub, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            <Folder className="h-3 w-3 text-gray-400" />
                            {sub}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(index)}
                            className="p-1 hover:bg-red-100 rounded transition-colors duration-200"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={adding}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editing ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {editing ? 'Update Category' : 'Add Category'}
                    </>
                  )}
                </Button>

                {editing && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={adding}
                    className="w-full border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="shadow-sm border-0 lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                All Categories ({categories.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No categories found. Add your first category!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat, idx) => (
                    <div 
                      key={cat._id} 
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 hover:border-gray-300 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Created: {formatDate(cat.createdAt)}</p>
                          
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {cat.subcategories.map((sub, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                >
                                  <Folder className="h-3 w-3" />
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(cat)}
                            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="h-8 w-8 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
