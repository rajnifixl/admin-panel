export const salesData = [
  { month: "Jan", sales: 4000, orders: 240 },
  { month: "Feb", sales: 3000, orders: 198 },
  { month: "Mar", sales: 5000, orders: 320 },
  { month: "Apr", sales: 4500, orders: 278 },
  { month: "May", sales: 6000, orders: 389 },
  { month: "Jun", sales: 5500, orders: 349 },
  { month: "Jul", sales: 7000, orders: 430 },
]

export const revenueData = [
  { name: "Direct", value: 35, fill: "var(--color-chart-1)" },
  { name: "Organic", value: 30, fill: "var(--color-chart-2)" },
  { name: "Referral", value: 20, fill: "var(--color-chart-3)" },
  { name: "Social", value: 15, fill: "var(--color-chart-4)" },
]

export const topProducts = [
  { id: 1, name: "Nike Air Max 270", category: "Shoes", sales: 1234, revenue: 148080, stock: 45, image: "/products/shoes.jpg" },
  { id: 2, name: "Apple Watch Series 9", category: "Electronics", sales: 987, revenue: 394800, stock: 23, image: "/products/watch.jpg" },
  { id: 3, name: "Sony WH-1000XM5", category: "Electronics", sales: 856, revenue: 299600, stock: 67, image: "/products/headphones.jpg" },
  { id: 4, name: "Levi's 501 Original", category: "Clothing", sales: 743, revenue: 59440, stock: 120, image: "/products/jeans.jpg" },
  { id: 5, name: "Samsung Galaxy Buds", category: "Electronics", sales: 654, revenue: 98100, stock: 89, image: "/products/earbuds.jpg" },
]

export const recentOrders = [
  { id: "#ORD-7352", customer: "Emma Thompson", email: "emma@example.com", product: "Nike Air Max 270", amount: 159.99, status: "delivered", date: "2024-01-15", avatar: "" },
  { id: "#ORD-7351", customer: "James Wilson", email: "james@example.com", product: "Apple Watch Series 9", amount: 399.00, status: "processing", date: "2024-01-15", avatar: "" },
  { id: "#ORD-7350", customer: "Sophia Martinez", email: "sophia@example.com", product: "Sony WH-1000XM5", amount: 349.99, status: "shipped", date: "2024-01-14", avatar: "" },
  { id: "#ORD-7349", customer: "Oliver Brown", email: "oliver@example.com", product: "Levi's 501 Original", amount: 79.99, status: "delivered", date: "2024-01-14", avatar: "" },
  { id: "#ORD-7348", customer: "Isabella Davis", email: "isabella@example.com", product: "Samsung Galaxy Buds", amount: 149.99, status: "pending", date: "2024-01-13", avatar: "" },
  { id: "#ORD-7347", customer: "Liam Anderson", email: "liam@example.com", product: "Nike Air Max 270", amount: 159.99, status: "delivered", date: "2024-01-13", avatar: "" },
  { id: "#ORD-7346", customer: "Ava Taylor", email: "ava@example.com", product: "Apple Watch Series 9", amount: 399.00, status: "cancelled", date: "2024-01-12", avatar: "" },
  { id: "#ORD-7345", customer: "Noah Garcia", email: "noah@example.com", product: "Sony WH-1000XM5", amount: 349.99, status: "processing", date: "2024-01-12", avatar: "" },
]

export const customers = [
  { id: 1, name: "Emma Thompson", email: "emma@example.com", orders: 23, spent: 4567.89, joinDate: "2023-03-15", status: "active", avatar: "" },
  { id: 2, name: "James Wilson", email: "james@example.com", orders: 18, spent: 3245.50, joinDate: "2023-05-22", status: "active", avatar: "" },
  { id: 3, name: "Sophia Martinez", email: "sophia@example.com", orders: 31, spent: 6789.00, joinDate: "2023-01-08", status: "active", avatar: "" },
  { id: 4, name: "Oliver Brown", email: "oliver@example.com", orders: 12, spent: 1234.56, joinDate: "2023-07-19", status: "inactive", avatar: "" },
  { id: 5, name: "Isabella Davis", email: "isabella@example.com", orders: 45, spent: 9876.54, joinDate: "2022-11-30", status: "active", avatar: "" },
  { id: 6, name: "Liam Anderson", email: "liam@example.com", orders: 8, spent: 876.32, joinDate: "2023-09-05", status: "active", avatar: "" },
  { id: 7, name: "Ava Taylor", email: "ava@example.com", orders: 15, spent: 2345.67, joinDate: "2023-04-12", status: "inactive", avatar: "" },
  { id: 8, name: "Noah Garcia", email: "noah@example.com", orders: 27, spent: 5432.10, joinDate: "2023-02-28", status: "active", avatar: "" },
]

export const products = [
  { id: 1, name: "Nike Air Max 270", sku: "NAM-270-001", category: "Shoes", price: 159.99, stock: 45, status: "active", image: "/products/shoes.jpg" },
  { id: 2, name: "Apple Watch Series 9", sku: "AW-S9-002", category: "Electronics", price: 399.00, stock: 23, status: "active", image: "/products/watch.jpg" },
  { id: 3, name: "Sony WH-1000XM5", sku: "SWH-XM5-003", category: "Electronics", price: 349.99, stock: 67, status: "active", image: "/products/headphones.jpg" },
  { id: 4, name: "Levi's 501 Original", sku: "LV-501-004", category: "Clothing", price: 79.99, stock: 120, status: "active", image: "/products/jeans.jpg" },
  { id: 5, name: "Samsung Galaxy Buds", sku: "SGB-PRO-005", category: "Electronics", price: 149.99, stock: 89, status: "active", image: "/products/earbuds.jpg" },
  { id: 6, name: "Adidas Ultraboost 22", sku: "AUB-22-006", category: "Shoes", price: 189.99, stock: 34, status: "active", image: "/products/running.jpg" },
  { id: 7, name: "Canon EOS R6", sku: "CER-6-007", category: "Electronics", price: 2499.00, stock: 8, status: "low-stock", image: "/products/camera.jpg" },
  { id: 8, name: "North Face Puffer", sku: "NFP-001-008", category: "Clothing", price: 299.00, stock: 0, status: "out-of-stock", image: "/products/jacket.jpg" },
  { id: 9, name: "Ray-Ban Aviator", sku: "RBA-001-009", category: "Accessories", price: 179.00, stock: 56, status: "active", image: "/products/sunglasses.jpg" },
  { id: 10, name: "Dyson V15 Detect", sku: "DV15-001-010", category: "Home", price: 749.99, stock: 12, status: "active", image: "/products/vacuum.jpg" },
]

export const statsCards = [
  { title: "Total Revenue", value: "$128,430", change: "+12.5%", trend: "up" as const, icon: "dollar" },
  { title: "Total Orders", value: "1,847", change: "+8.2%", trend: "up" as const, icon: "shopping-cart" },
  { title: "Active Customers", value: "3,462", change: "+15.3%", trend: "up" as const, icon: "users" },
  { title: "Conversion Rate", value: "3.24%", change: "-2.1%", trend: "down" as const, icon: "trending" },
]

export const trafficData = [
  { day: "Mon", visitors: 1200 },
  { day: "Tue", visitors: 1900 },
  { day: "Wed", visitors: 1500 },
  { day: "Thu", visitors: 2100 },
  { day: "Fri", visitors: 2400 },
  { day: "Sat", visitors: 1800 },
  { day: "Sun", visitors: 1400 },
]
