"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, RefreshCw, Users, ChevronRight } from "lucide-react"
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
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage your customer base</p>
          </div>
          <Button onClick={fetchCustomers} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Customers</div>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Avg Orders / Customer</div>
              <div className="text-2xl font-bold">
                {customers.length > 0
                  ? (customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customers.length).toFixed(1)
                  : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">All Customers</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Filter Type Dropdown */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "name" | "email")}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <option value="all">All Fields</option>
                  <option value="name">By Name</option>
                  <option value="email">By Email</option>
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search customers${filterType !== "all" ? ` by ${filterType}` : ""}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Loading customers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(customer => (
                      <tr 
                        key={customer._id} 
                        onClick={() => handleCustomerClick(customer._id)}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {customer.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {customer.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold flex items-center justify-between">
                          <span>{customer.totalOrders || 0}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center px-4 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {customers.length} customers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}