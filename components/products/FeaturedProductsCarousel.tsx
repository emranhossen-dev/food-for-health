'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

export default function FeaturedProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, Math.ceil(products.length / 3) - 1)
        return prevIndex >= maxIndex ? 0 : prevIndex + 1
      })
    }, 5000) // Auto-scroll every 5 seconds

    return () => clearInterval(interval)
  }, [products.length])

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*)
        `)
        .eq('is_featured', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(12) // Get up to 12 products for carousel

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, Math.ceil(products.length / 3) - 1)
      return prevIndex <= 0 ? maxIndex : prevIndex - 1
    })
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, Math.ceil(products.length / 3) - 1)
      return prevIndex >= maxIndex ? 0 : prevIndex + 1
    })
  }

  const getVisibleProducts = () => {
    const start = currentIndex * 3
    return products.slice(start, start + 3)
  }

  const totalPages = Math.ceil(products.length / 3)

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <p className="text-gray-500">No featured products available at the moment.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={totalPages <= 1}
              className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={totalPages <= 1}
              className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`
              }}
            >
              {products.map((product) => (
                <div key={product.id} className="flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation dots */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex 
                      ? 'bg-primary' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
