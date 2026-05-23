'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
  created_at: string
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    image_url: ''
  })

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
      setCategories(data || [])
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

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabaseAdmin
          .from('categories')
          .update({
            name_en: formData.name_en.trim(),
            name_bn: formData.name_bn?.trim() || null,
            image_url: formData.image_url?.trim() || null
          })
          .eq('id', editingCategory.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        toast.success('Category updated successfully!')
      } else {
        // Create new category
        const { error } = await supabaseAdmin
          .from('categories')
          .insert({
            name_en: formData.name_en.trim(),
            name_bn: formData.name_bn?.trim() || null,
            image_url: formData.image_url?.trim() || null
          })

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        toast.success('Category added successfully!')
      }

      // Reset form
      setFormData({ name_en: '', name_bn: '', image_url: '' })
      setEditingCategory(null)
      setShowAddForm(false)
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
      image_url: category.image_url || ''
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
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name (Bangla)
              </label>
              <input
                type="text"
                value={formData.name_bn}
                onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="বিভাগের নাম"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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
                  setFormData({ name_en: '', name_bn: '', image_url: '' })
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
