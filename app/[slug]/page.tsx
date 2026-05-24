'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/products/ProductCard'
import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
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
}

interface Category {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
  slug: string
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      fetchCategoryData()
    }
  }, [slug])

  const fetchCategoryData = async () => {
    try {
      let categoryData = null
      let categoryError = null

      // Try to get category by slug first
      const { data: slugData, error: slugError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      // If slug doesn't exist or fails, try by ID (fallback for existing categories)
      if (slugError) {
        console.log('Slug lookup failed, trying ID lookup...')
        const { data: idData, error: idError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', slug)
          .single()
        
        categoryData = idData
        categoryError = idError
      } else {
        categoryData = slugData
        categoryError = slugError
      }

      // If both slug and ID lookup fail, try to find by generated slug
      if (categoryError) {
        console.log('Direct lookup failed, trying all categories...')
        const { data: allCategories, error: allError } = await supabase
          .from('categories')
          .select('*')

        if (!allError && allCategories) {
          // Generate slug for each category and match
          const found = allCategories.find(cat => {
            const generatedSlug = cat.name_en
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '') // Remove special characters
              .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphen
              .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            return generatedSlug === slug
          })

          if (found) {
            categoryData = found
            categoryError = null
          }
        }
      }

      if (categoryError) {
        console.error('Category fetch error:', categoryError)
        toast.error('Category not found')
        return
      }

      setCategory(categoryData)

      // Then get products for this category
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          product_images(image_url, is_primary)
        `)
        .eq('category_id', categoryData.id)
        .order('created_at', { ascending: false })

      if (productError) {
        console.error('Products fetch error:', productError)
        toast.error('Failed to load products')
        return
      }

      // Transform the data to match the ProductCard interface
      const transformedProducts = productData?.map((product: any) => ({
        ...product,
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

      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error fetching category data:', error)
      toast.error('Failed to load category data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600">The category you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Categories (same as homepage) */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategorySidebar />
          </div>
          
          {/* Right Section - Category Header */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-4">
                {category.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={category.image_url}
                      alt={category.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{category.name_en}</h1>
                  {category.name_bn && (
                    <p className="text-lg text-gray-600 font-bengali">{category.name_bn}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="mt-6">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products in this category</h3>
                  <p className="text-gray-600">Check back later for products in {category.name_en}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
