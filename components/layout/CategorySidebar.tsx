'use client'

import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
}

export default function CategorySidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_en')

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
      <div className="w-full h-[80vh] bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[80vh] bg-white rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        Categories
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.id}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">
                    {category.name_en.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                {category.name_en}
              </p>
              {category.name_bn && (
                <p className="text-xs text-gray-500 truncate font-bengali">
                  {category.name_bn}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No categories available</p>
        </div>
      )}
    </div>
  )
}
