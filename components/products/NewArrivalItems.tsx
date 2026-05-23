'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { supabase } from '@/lib/supabase'

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
}

export default function NewArrivalItems() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNewArrivalProducts()
  }, [])

  const fetchNewArrivalProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*)
        `)
        .eq('status', 'new_arrival')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(8)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching new arrival products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="w-full py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h2>
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-2">No new arrivals available yet.</p>
            <p className="text-gray-400 text-sm">Add products and mark them as "new arrival" from the admin panel to see them here.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
