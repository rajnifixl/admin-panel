"use client"

import { DollarSign, ShoppingCart, Users, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const icons = {
  dollar: DollarSign,
  "shopping-cart": ShoppingCart,
  users: Users,
  trending: TrendingUp,
}

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: keyof typeof icons
}

export function StatsCard({ title, value, change, trend, icon }: StatsCardProps) {
  const Icon = icons[icon]
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {change}
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
