"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Package } from "lucide-react"
import Link from "next/link"

interface ProductDetailViewProps {
  product: any
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
  productId?: string
}

const categoryColors: Record<string, string> = {
  Men: "bg-blue-100 text-blue-700",
  Women: "bg-pink-100 text-pink-700",
  Kids: "bg-green-100 text-green-700",
}

const getStockStatus = (stock: number) => {
  if (stock === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-700", icon: "🔴" }
  if (stock < 10) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-700", icon: "🟡" }
  return { status: "In Stock", color: "bg-green-100 text-green-700", icon: "🟢" }
}

export function ProductDetailView({
  product,
  onEdit,
  onDelete,
  showActions = true,
  productId,
}: ProductDetailViewProps) {
  const stock = product.stock ?? 50
  const stockInfo = getStockStatus(stock)

  return (
    <div className="space-y-6">
      {/* Images */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Product Images</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {product.image?.map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              alt={product.name}
              className="h-24 w-24 object-cover rounded-lg flex-shrink-0 border border-border"
            />
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="font-semibold text-sm">{product.name}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Price</p>
          <p className="font-semibold text-sm text-green-600">₹{product.price}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Category</p>
          <p className="font-semibold text-sm">{product.category}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Sub Category</p>
          <p className="font-semibold text-sm">{product.subCategory || "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Stock</p>
          <p className="font-semibold text-sm">{stock} units</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <Badge className={getStockStatus(stock).color}>
            {getStockStatus(stock).icon} {getStockStatus(stock).status}
          </Badge>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Bestseller</p>
          <p className="font-semibold text-sm">{product.bestseller ? "✅ Yes" : "❌ No"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Added</p>
          <p className="font-semibold text-sm">
            {product.date ? new Date(product.date).toLocaleDateString("en-IN") : "—"}
          </p>
        </div>
      </div>

      {/* Sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2">Sizes</p>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((size: string) => (
              <Badge key={size} variant="outline">
                {size}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground mb-2">Description</p>
        <p className="text-sm text-muted-foreground">{product.description || "No description"}</p>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2 pt-4">
          {productId && (
            <Link href={`/products/edit/${productId}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
          {onEdit && (
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" className="flex-1" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
