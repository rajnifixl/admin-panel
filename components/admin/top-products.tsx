"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Package, RefreshCw } from "lucide-react"
import { authFetch } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export function TopProducts() {
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      try {
        console.log('📡 TopProducts - Fetching orders...')
        const data = await authFetch('/api/order/list')
        console.log('📡 TopProducts - Response:', data)
        
        if (data.success) {
          // Count sales per product from real orders
          const salesMap: Record<string, { name: string; sales: number; image?: string }> = {}

          data.orders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
              const key = item.productId || item.name
              if (!salesMap[key]) {
                salesMap[key] = { name: item.name, sales: 0, image: item.image }
              }
              salesMap[key].sales += item.quantity || 1
            })
          })

          const sorted = Object.values(salesMap)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)

          setTopProducts(sorted)
        }
      } catch (err: any) {
        console.error("❌ Top products error:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [])

  const maxSales = Math.max(...topProducts.map(p => p.sales), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Top Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          topProducts.map((product, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded-lg" />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate pr-2">{product.name}</p>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {product.sales} sold
                  </span>
                </div>
                <Progress value={(product.sales / maxSales) * 100} className="h-2" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}