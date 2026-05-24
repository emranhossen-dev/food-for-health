'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/products/ProductCard'
import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
import { Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name_en: string
  name_bn?: string
  description?: string
  current_price: number
  old_price?: number
  discount_percentage?: number
  stock_quantity: number
  unit: string
  unit_type: 'solid' | 'liquid' | 'quantity'
  status: 'none' | 'new_arrival' | 'best_selling' | 'featured'
  product_images: Array<{
    id: string
    image_url: string
    is_primary: boolean
  }>
  quantity_prices?: {
    [key: string]: {
      current_price: number
      old_price?: number
      discount_percentage?: number
    }
  }
  category: {
    id: string
    name_en: string
    name_bn?: string
  }
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    fetchProducts()
  }, [searchTerm, filterStatus, sortBy])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(image_url, is_primary),
          categories!inner(id, name_en, name_bn)
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

      const { data, error } = await query

      if (error) throw error

      // Transform the data to match the ProductCard interface
      const transformedProducts = data?.map((product: any) => ({
        ...product,
        category: product.categories,
        product_images: product.product_images?.map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          is_primary: img.is_primary
        })) || [{
          id: 'default',
          image_url: '/placeholder.jpg',
          is_primary: true
        }]
      })) || []

      // Apply sorting
      const sortedProducts = [...transformedProducts].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name_en.localeCompare(b.name_en)
          case 'price_low':
            return a.current_price - b.current_price
          case 'price_high':
            return b.current_price - a.current_price
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          default:
            return 0
        }
      })

      setProducts(sortedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 flex-shrink-0">
              <CategorySidebar />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Categories */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategorySidebar />
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
              <p className="text-gray-600">Browse our complete collection of health products</p>
              
              {/* Filters and Search */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="none">Regular</option>
                    <option value="new_arrival">New Arrival</option>
                    <option value="best_selling">Best Selling</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
                
                <div className="sm:w-40">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {products.length} products
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
