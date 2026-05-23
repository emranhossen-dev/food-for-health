'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Product {
  id: string
  name_en: string
  name_bn?: string
  current_price: number
  old_price?: number
  stock_quantity: number
  unit: string
  category_id?: string
  status: string
  is_featured: boolean
  created_at: string
  categories?: {
    name_en: string
  }
  product_images?: Array<{
    image_url: string
    is_primary: boolean
  }>
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchProducts()
  }, [searchTerm, filterStatus, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name_en),
          product_images(image_url, is_primary)
        `)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name_en.ilike.%${searchTerm}%,name_bn.ilike.%${searchTerm}%`)
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error, count } = await query

      if (error) throw error

      setProducts(data || [])
      setTotalPages(Math.ceil((count || 0) / 10))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const getPrimaryImage = (product: Product) => {
    return product.product_images?.find(img => img.is_primary) || product.product_images?.[0]
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new_arrival: { label: 'New Arrival', className: 'bg-blue-100 text-blue-800' },
      best_selling: { label: 'Best Selling', className: 'bg-orange-100 text-orange-800' },
      featured: { label: 'Featured', className: 'bg-purple-100 text-purple-800' },
      none: { label: 'None', className: 'bg-gray-100 text-gray-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">All Products</h1>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new_arrival">New Arrival</option>
              <option value="best_selling">Best Selling</option>
              <option value="featured">Featured</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No products found. Add your first product above!
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage = getPrimaryImage(product)
                  return (
                    <tr key={product.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage.image_url}
                                alt={product.name_en}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg'
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {product.name_en}
                            </div>
                            {product.name_bn && (
                              <div className="text-sm text-gray-400 font-bengali">
                                {product.name_bn}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {product.unit}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {product.categories?.name_en || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            ৳{product.current_price}
                          </span>
                          {product.old_price && (
                            <span className="text-xs text-gray-400 line-through">
                              ৳{product.old_price}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          product.stock_quantity > 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                        {product.is_featured && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
