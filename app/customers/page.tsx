"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, RefreshCw, Users, ChevronRight, Package } from "lucide-react"
import { toast } from "sonner"
import { authFetch, isLoggedIn } from "@/lib/api"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "name" | "email">("all")

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching customers...')
      const data = await authFetch('/api/user/list')
      console.log('📡 Customers response:', data)
      
      if (data.success) {
        setCustomers(data.users)
        console.log('✅ Loaded', data.users.length, 'customers')
      } else {
        toast.error(data.message || "Failed to fetch customers")
      }
    } catch (err: any) {
      console.error('❌ Fetch customers error:', err.message)
      toast.error(err.message || "Cannot connect to backend")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    fetchCustomers()
  }, [router])

  const filtered = customers.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    
    if (filterType === "name") {
      return c.name?.toLowerCase().includes(query)
    } else if (filterType === "email") {
      return c.email?.toLowerCase().includes(query)
    } else {
      // "all" - search both name and email
      return c.name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
    }
  })

  return (
    <AdminLayout>
      <div className="space-y-6 page-enter">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer base</p>
          </div>
          <Button onClick={fetchCustomers} variant="outline" className="w-full sm:w-auto btn-premium">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card stat-card-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-purple">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
                  </p>
                </div>
                <Package className="h-12 w-12 text-purple-500/20" />
              </div>
            </CardContent>
          </div>
          <div className="stat-card stat-card-orange">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Orders / Customer</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {customers.length > 0
                      ? (customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customers.length).toFixed(1)
                      : "0"}
                  </p>
                </div>
                <ChevronRight className="h-12 w-12 text-orange-500/20" />
              </div>
            </CardContent>
          </div>
        </div>

        {/* Table */}
        <Card className="card-premium">
          <CardHeader className="pb-4 border-b border-gray-200/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-bold text-gray-900">All Customers</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Filter Type Dropdown */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "name" | "email")}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors input-premium"
                >
                  <option value="all">All Fields</option>
                  <option value="name">By Name</option>
                  <option value="email">By Email</option>
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={`Search customers${filterType !== "all" ? ` by ${filterType}` : ""}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64 input-premium"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Loading customers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="hidden md:table-cell">Email</th>
                      <th className="hidden lg:table-cell">Joined</th>
                      <th>Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(customer => (
                      <tr 
                        key={customer._id} 
                        onClick={() => handleCustomerClick(customer._id)}
                        className="hover-lift cursor-pointer"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-400 to-blue-600">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                                {customer.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-gray-900">{customer.name}</span>
                          </div>
                        </td>
                        <td className="text-sm text-gray-600 hidden md:table-cell">
                          {customer.email}
                        </td>
                        <td className="text-sm text-gray-600 hidden lg:table-cell">
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })
                            : "—"}
                        </td>
                        <td className="text-sm font-bold text-gray-900 flex items-center justify-between">
                          <span className="badge-info">{customer.totalOrders || 0} orders</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center px-6 py-4 border-t border-gray-200/50 bg-gray-50/50">
              <p className="text-sm text-gray-600 font-medium">
                Showing <span className="font-bold text-gray-900">{filtered.length}</span> of <span className="font-bold text-gray-900">{customers.length}</span> customers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}