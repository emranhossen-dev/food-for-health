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

interface Category {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
}

interface CategoryProductsProps {
  category: Category
}

function CategoryProducts({ category }: CategoryProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoryProducts()
  }, [category.id])

  const fetchCategoryProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*)
        `)
        .eq('category_id', category.id)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error(`Error fetching products for category ${category.name_en}:`, error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No products available in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default function FeaturedCategoryItems() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedCategories()
  }, [])

  const fetchFeaturedCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_en')
        .limit(3)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Categories</h2>
          
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-12">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="bg-gray-200 rounded-lg h-80"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="w-full py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Categories</h2>
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <p className="text-gray-500">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Categories</h2>
        
        {categories.map((category) => (
          <div key={category.id} className="mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-xl font-semibold text-gray-700">{category.name_en}</h3>
              {category.name_bn && (
                <span className="text-xl text-gray-600 font-bengali">({category.name_bn})</span>
              )}
            </div>
            <CategoryProducts category={category} />
          </div>
        ))}
      </div>
    </section>
  )
}
