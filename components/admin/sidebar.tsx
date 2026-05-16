"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  Store,
  RotateCcw,
  MessageSquare,
  FolderTree,
  BookOpen,
  Folder,
  Tag,
  Sparkles,
  Image,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Banners", href: "/banners", icon: Image },
  { name: "Coupons", href: "/coupons", icon: Tag },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Customer Queries", href: "/customer-queries", icon: MessageSquare },
  { name: "Returns", href: "/returns", icon: RotateCcw },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Blogs", href: "/blogs", icon: BookOpen },
  { name: "Blog Categories", href: "/blogs/categories", icon: Folder },
  // { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[#1f2437] to-[#1a1d2e] text-sidebar-foreground transition-all duration-300 flex flex-col border-r border-white/5",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <Store className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ShopAdmin</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200",
            collapsed && "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20 shadow-lg"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto scrollbar-hide">
        <div className={cn("mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-white/40", collapsed && "hidden")}>
          Main Menu
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60"
                  : "text-white/70 hover:text-white/90 hover:bg-white/8",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              {/* Background glow effect for inactive items on hover */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 transition-all duration-300 -z-10" />
              )}

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-blue-300 to-indigo-400 rounded-r-full shadow-lg shadow-blue-400/50" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative shrink-0 transition-all duration-300",
                  isActive
                    ? "scale-110 text-white drop-shadow-lg"
                    : "text-white/60 group-hover:text-white/90 group-hover:scale-105"
                )}
              >
                <item.icon className="h-5 w-5" />
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-lg blur-md opacity-40 -z-10" />
                )}
              </div>

              {/* Text */}
              {!collapsed && (
                <span
                  className={cn(
                    "transition-all duration-300 font-medium",
                    isActive ? "text-white" : "text-white/70 group-hover:text-white/90"
                  )}
                >
                  {item.name}
                </span>
              )}

              {/* Hover shine effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 group-hover:via-white/10" />
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-white/10 px-3 py-4 space-y-2">
        <button
          className={cn(
            "group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
            "text-white/70 hover:text-white/90 hover:bg-red-500/15"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-300 -z-10" />

          {/* Icon */}
          <div className="relative shrink-0 transition-all duration-300 text-white/60 group-hover:text-red-400 group-hover:scale-105">
            <LogOut className="h-5 w-5" />
          </div>

          {/* Text */}
          {!collapsed && (
            <span className="transition-all duration-300 font-medium text-white/70 group-hover:text-red-400">
              Logout
            </span>
          )}

          {/* Hover shine effect */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 group-hover:via-white/10" />
          </div>
        </button>
      </div>
    </aside>
  )
}
