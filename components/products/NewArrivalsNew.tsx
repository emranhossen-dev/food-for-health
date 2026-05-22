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

export default function NewArrivalsNew() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNewArrivals()
  }, [])

  const fetchNewArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(image_url, is_primary),
          categories(name)
        `)
        .eq('status', 'new_arrival')
        .gt('stock_quantity', 0)
        .limit(4)

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
      console.error('Error fetching new arrivals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-surface-container rounded-xl p-4 flex gap-4 items-center animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-surface-container rounded-xl p-4 flex gap-4 items-center group cursor-pointer hover:bg-surface-container-high transition-colors"
        >
          <img
            className="w-20 h-20 rounded-lg object-cover"
            src={product.image_url}
            alt={product.name}
          />
          <div>
            <h4 className="font-label-lg text-label-lg text-on-surface">{product.name}</h4>
            <p className="text-on-surface-variant text-label-sm">{product.category_name || 'Products'}</p>
            <p className="text-primary font-bold">${product.current_price.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
