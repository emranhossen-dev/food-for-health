'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Package, Users, ShoppingCart, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  newCustomers: number
}

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    newCustomers: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch total products
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productError) throw productError

      // Fetch total orders
      const { count: orderCount, error: orderError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      if (orderError) throw orderError

      // Fetch total sales
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid')

      if (salesError) throw salesError

      // Fetch new customers (users created in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: customerCount, error: customerError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (customerError) throw customerError

      // Fetch recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (ordersError) throw ordersError

      const totalSales = salesData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      setStats({
        totalSales,
        totalOrders: orderCount || 0,
        totalProducts: productCount || 0,
        newCustomers: customerCount || 0
      })

      setRecentOrders(ordersData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const StatCard = ({ title, value, icon: Icon, change }: { 
    title: string
    value: string | number
    icon: React.ElementType
    change?: string
  }) => (
    <div className="bg-gray-700 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className="text-sm text-green-400 mt-1">{change}</p>
          )}
        </div>
        <div className="p-3 bg-primary/20 rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Sales"
              value={`৳${stats.totalSales.toLocaleString()}`}
              icon={DollarSign}
              change="+12% from last month"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingCart}
              change="+8% from last month"
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts.toLocaleString()}
              icon={Package}
              change="+2 new products"
            />
            <StatCard
              title="New Customers"
              value={stats.newCustomers.toLocaleString()}
              icon={Users}
              change="+15% from last month"
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-700 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {'#' + order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ৳{order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No orders found</p>
                </div>
              )}
            </div>
          </div>
    </div>
  )
}
