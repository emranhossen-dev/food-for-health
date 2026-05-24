'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon, Bot } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
  slug?: string
  created_at: string
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiFilled, setAiFilled] = useState(false)
  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    image_url: '',
    slug: ''
  })

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...')
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch error:', error)
        throw error
      }
      console.log('Categories fetched:', data)
      
      // Ensure all categories have slug property (even if null)
      const categoriesWithSlug = (data || []).map((cat: any) => ({
        ...cat,
        slug: cat.slug || null
      }))
      
      setCategories(categoriesWithSlug)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.name_en.trim()) {
      toast.error('Category name (English) is required')
      setLoading(false)
      return
    }

    const categorySlug = formData.slug.trim() || generateSlug(formData.name_en.trim())

    // Check for duplicate category name
    const { data: existingName, error: nameError } = await supabase
      .from('categories')
      .select('id, name_en')
      .ilike('name_en', formData.name_en.trim())
      .neq('id', editingCategory?.id || '00000000-0000-0000-0000-000000000000')
      .single()

    if (existingName) {
      toast.error('A category with this name already exists')
      setLoading(false)
      return
    }

    // Check for duplicate slug
    const { data: existingSlug, error: slugError } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', categorySlug)
      .neq('id', editingCategory?.id || '00000000-0000-0000-0000-000000000000')
      .single()

    if (existingSlug) {
      toast.error('A category with this slug already exists')
      setLoading(false)
      return
    }

    try {
      
      if (editingCategory) {
        // Update existing category - try with slug first
        let updateData: any = {
          name_en: formData.name_en.trim(),
          name_bn: formData.name_bn?.trim() || null,
          image_url: formData.image_url?.trim() || null
        }

        // Try to include slug if column exists
        try {
          updateData.slug = categorySlug
          const { error } = await supabaseAdmin
            .from('categories')
            .update(updateData)
            .eq('id', editingCategory.id)

          if (error) {
            if (error.message?.includes('slug')) {
              // Slug column doesn't exist, try without it
              delete updateData.slug
              const { error: retryError } = await supabaseAdmin
                .from('categories')
                .update(updateData)
                .eq('id', editingCategory.id)

              if (retryError) throw retryError
              toast.success('Category updated successfully! (Slug will be added after database migration)')
            } else {
              throw error
            }
          } else {
            toast.success('Category updated successfully!')
          }
        } catch (updateError: any) {
          if (updateError.message?.includes('slug')) {
            // Slug column doesn't exist, try without it
            delete updateData.slug
            const { error: retryError } = await supabaseAdmin
              .from('categories')
              .update(updateData)
              .eq('id', editingCategory.id)

            if (retryError) throw retryError
            toast.success('Category updated successfully! (Slug will be added after database migration)')
          } else {
            throw updateError
          }
        }
      } else {
        // Create new category - try with slug first
        let insertData: any = {
          name_en: formData.name_en.trim(),
          name_bn: formData.name_bn?.trim() || null,
          image_url: formData.image_url?.trim() || null
        }

        try {
          insertData.slug = categorySlug
          const { error } = await supabaseAdmin
            .from('categories')
            .insert(insertData)

          if (error) {
            if (error.message?.includes('slug')) {
              // Slug column doesn't exist, try without it
              delete insertData.slug
              const { error: retryError } = await supabaseAdmin
                .from('categories')
                .insert(insertData)

              if (retryError) throw retryError
              toast.success('Category added successfully! (Slug will be added after database migration)')
            } else {
              throw error
            }
          } else {
            toast.success('Category added successfully!')
          }
        } catch (insertError: any) {
          if (insertError.message?.includes('slug')) {
            // Slug column doesn't exist, try without it
            delete insertData.slug
            const { error: retryError } = await supabaseAdmin
              .from('categories')
              .insert(insertData)

            if (retryError) throw retryError
            toast.success('Category added successfully! (Slug will be added after database migration)')
          } else {
            throw insertError
          }
        }
      }

      // Reset form
      setFormData({ name_en: '', name_bn: '', image_url: '', slug: '' })
      setEditingCategory(null)
      setShowAddForm(false)
      setAiFilled(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name_en: category.name_en,
      name_bn: category.name_bn || '',
      image_url: category.image_url || '',
      slug: category.slug || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all products in this category.')) return

    try {
      // First check if there are products associated with this category
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)

      if (checkError) throw checkError

      if (products && products.length > 0) {
        if (!confirm(`This category has ${products.length} product(s). Deleting this category will also delete all associated products. Are you absolutely sure?`)) {
          return
        }
      }

      // Delete the category using service role client (bypasses RLS)
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Category deleted successfully!')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category: ' + (error as Error).message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      }
      
      // Auto-generate slug when category name changes and slug is empty
      if (name === 'name_en' && !prev.slug.trim()) {
        updated.slug = generateSlug(value)
      }
      
      return updated
    })
  }

  const handleAiFill = async () => {
    // Prevent AI fill if already filled
    if (aiFilled) {
      toast.error('AI fill already used. Please clear the form to use AI fill again.')
      return
    }
    
    setAiLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate AI suggestions based on current input or create new suggestions
      const categoryName = formData.name_en.toLowerCase()
      
      let mockAiData = {
        name_en: '',
        name_bn: '',
        image_url: ''
      }

      // If user has entered some text, enhance it; otherwise generate a suggestion
      if (categoryName.trim()) {
        // Enhance existing input
        if (categoryName.includes('dairy') || categoryName.includes('milk')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'দুগ্ধজাত পণ্য',
            image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('fruit') || categoryName.includes('ফল')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'ফলমূল',
            image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('vegetable') || categoryName.includes('সবজি')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'শাকসবজি',
            image_url: 'https://images.unsplash.com/photo-1590523740021-a7ba4e8cc18c?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('meat') || categoryName.includes('মাংস')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'মাংস ও মাছ',
            image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('bakery') || categoryName.includes('bread')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'বেকারি',
            image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('beverage') || categoryName.includes('drink')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'পানীয়',
            image_url: 'https://images.unsplash.com/photo-1544145945-f263640c7c2e?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('snack') || categoryName.includes('খাবার')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'জলখাবার',
            image_url: 'https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('organic') || categoryName.includes('প্রাকৃতিক')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'প্রাকৃতিক খাদ্য',
            image_url: 'https://images.unsplash.com/photo-1478369402113-1fd53f17e8b4?w=400&h=300&fit=crop'
          }
        } else if (categoryName.includes('supplement') || categoryName.includes('ভিটামিন')) {
          mockAiData = {
            name_en: formData.name_en,
            name_bn: 'সাপ্লিমেন্ট',
            image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
          }
        } else {
          // Default enhancement
          mockAiData = {
            name_en: formData.name_en,
            name_bn: formData.name_en,
            image_url: 'https://images.unsplash.com/photo-1542821371-29b0f74f9713?w=400&h=300&fit=crop'
          }
        }
      } else {
        // Generate completely new category suggestions
        const suggestions = [
          { name_en: 'Fresh Fruits', name_bn: 'তাজা ফলমূল', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop' },
          { name_en: 'Organic Vegetables', name_bn: 'প্রাকৃতিক সবজি', image_url: 'https://images.unsplash.com/photo-1590523740021-a7ba4e8cc18c?w=400&h=300&fit=crop' },
          { name_en: 'Dairy Products', name_bn: 'দুগ্ধজাত পণ্য', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop' },
          { name_en: 'Fresh Meat', name_bn: 'তাজা মাংস', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
          { name_en: 'Bakery Items', name_bn: 'বেকারি পণ্য', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop' },
          { name_en: 'Beverages', name_bn: 'পানীয়', image_url: 'https://images.unsplash.com/photo-1544145945-f263640c7c2e?w=400&h=300&fit=crop' },
          { name_en: 'Healthy Snacks', name_bn: 'স্বাস্থ্যকর জলখাবার', image_url: 'https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?w=400&h=300&fit=crop' },
          { name_en: 'Vitamins & Supplements', name_bn: 'ভিটামিন ও সাপ্লিমেন্ট', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
          { name_en: 'Seafood', name_bn: 'সামুদ্রিক খাবার', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
          { name_en: 'Grains & Cereals', name_bn: 'শস্য ও খাদ্যশস্য', image_url: 'https://images.unsplash.com/photo-1542821371-29b0f74f9713?w=400&h=300&fit=crop' }
        ]
        
        // Pick a random suggestion
        mockAiData = suggestions[Math.floor(Math.random() * suggestions.length)]
      }

      // Fill form with AI-generated data (only fill truly empty fields)
      setFormData(prev => {
        const updatedData = { ...prev }
        
        // Only fill fields that are currently empty
        if (!prev.name_en || prev.name_en.trim() === '') {
          updatedData.name_en = mockAiData.name_en
        }
        if (!prev.name_bn || prev.name_bn.trim() === '') {
          updatedData.name_bn = mockAiData.name_bn
        }
        if (!prev.image_url || prev.image_url.trim() === '') {
          updatedData.image_url = mockAiData.image_url
        }
        // Only update slug if it's empty and we have a name
        if ((!prev.slug || prev.slug.trim() === '') && (updatedData.name_en || prev.name_en)) {
          updatedData.slug = generateSlug(updatedData.name_en || prev.name_en)
        }
        
        return updatedData
      })

      toast.success('Category details filled with AI assistance!')
      setAiFilled(true)
    } catch (error) {
      console.error('AI fill error:', error)
      toast.error('Failed to fill category details')
    } finally {
      setAiLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name (English) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter category name"
                />
                <button
                  type="button"
                  onClick={handleAiFill}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Auto-fill with AI"
                >
                  <Bot className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  AI Fill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ name_en: '', name_bn: '', image_url: '', slug: '' })
                    setAiFilled(false)
                    toast.success('Form cleared')
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  title="Clear form"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Form
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name (Bangla)
              </label>
              <input
                type="text"
                name="name_bn"
                value={formData.name_bn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="বিভাগের নাম"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="category-name"
              />
              <p className="text-xs text-gray-400 mt-1">
                Auto-generated from category name. Used for clean URLs like /{formData.slug || 'category-name'}/
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCategory(null)
                  setFormData({ name_en: '', name_bn: '', image_url: '', slug: '' })
                  setAiFilled(false)
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bangla Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No categories found. Add your first category above!
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {category.name_en}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-bengali">
                        {category.name_bn || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name_en}
                          className="h-10 w-10 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.jpg'
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(category.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
