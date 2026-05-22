'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  current_price: number
  image_url: string
  category_name?: string
}

export default function MostPopularItemsNew() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPopularProducts()
  }, [])

  const fetchPopularProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(image_url, is_primary),
          categories(name)
        `)
        .eq('status', 'best_selling')
        .gt('stock_quantity', 0)
        .limit(5)

      if (error) throw error

      const formattedProducts = data?.map(product => ({
        id: product.id,
        name: product.name_en,
        current_price: product.current_price,
        image_url: product.product_images.find((img: any) => img.is_primary)?.image_url || 
                  product.product_images[0]?.image_url || '/placeholder.jpg',
        category_name: product.categories?.name
      })) || []

      setProducts(formattedProducts)
    } catch (error) {
      console.error('Error fetching popular products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-stack-md">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-surface rounded-lg p-3 border border-outline-variant animate-pulse">
            <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-stack-md">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-surface rounded-lg p-3 border border-outline-variant hover:shadow-md transition-all cursor-pointer"
        >
          <img
            className="w-full h-32 object-cover rounded mb-3"
            src={product.image_url}
            alt={product.name}
          />
          <p className="font-label-sm text-label-sm text-on-surface truncate">{product.name}</p>
          <p className="text-primary font-bold">${product.current_price.toFixed(2)}</p>
        </div>
      ))}
      
      {/* Placeholder for 5th item on desktop if we have less than 5 products */}
      {products.length < 5 && (
        <div className="hidden lg:block bg-surface rounded-lg p-3 border border-outline-variant hover:shadow-md transition-all cursor-pointer">
          <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
            <span className="text-gray-400 text-sm">More</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface truncate">View All Products</p>
          <p className="text-primary font-bold">→</p>
        </div>
      )}
    </div>
  )
}
