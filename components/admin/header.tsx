"use client"

import { Search, Menu, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
  }

  const handleProfileClick = () => {
    router.push("/admin-profile")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl px-4 md:px-6 shadow-sm">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden hover:bg-gray-100 transition-colors duration-200"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          <Input
            placeholder="Search orders, products, customers..."
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all duration-200 rounded-lg"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Button 
          variant="ghost" 
          size="icon"
          className="relative hover:bg-gray-100 transition-colors duration-200"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
        </Button>

        {/* Admin Profile Button */}
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-2 hover:bg-gray-100 transition-colors duration-200"
          onClick={handleProfileClick}
          title="Admin Profile"
        >
          <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600">
            <AvatarFallback className="text-white text-sm font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium text-gray-900">Admin</span>
            <span className="text-xs text-gray-500">Profile</span>
          </div>
        </Button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
          className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  )
}
