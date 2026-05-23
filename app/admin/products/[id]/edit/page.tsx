'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
  key_health_benefits: string[]
  nutritional_info?: any
  dosage_and_usage?: string
  is_featured: boolean
  category_id: string
  created_at: string
  product_images: Array<{
    id: string
    image_url: string
    is_primary: boolean
  }>
  category?: {
    id: string
    name_en: string
    name_bn?: string
  }
}

interface Category {
  id: string
  name_en: string
  name_bn?: string
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [benefitInput, setBenefitInput] = useState('')

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    description: '',
    current_price: '',
    old_price: '',
    discount_percentage: '',
    stock_quantity: '',
    unit: '',
    unit_type: 'solid' as const,
    category_id: '',
    status: 'none' as const,
    key_health_benefits: [] as string[],
    nutritional_info: '',
    dosage_and_usage: '',
    is_featured: false,
    images: [] as Array<{
      id: string
      url: string
      is_primary: boolean
    }>
  })

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          product_images (*),
          category:categories (*)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
      
      // Populate form with product data
      setFormData({
        name_en: data.name_en || '',
        name_bn: data.name_bn || '',
        description: data.description || '',
        current_price: data.current_price?.toString() || '',
        old_price: data.old_price?.toString() || '',
        discount_percentage: data.discount_percentage?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '',
        unit: data.unit || '',
        unit_type: data.unit_type || 'solid',
        category_id: data.category_id || '',
        status: data.status || 'none',
        key_health_benefits: data.key_health_benefits || [],
        nutritional_info: data.nutritional_info ? JSON.stringify(data.nutritional_info, null, 2) : '',
        dosage_and_usage: data.dosage_and_usage || '',
        is_featured: data.is_featured || false,
        images: data.product_images?.map((img: any) => ({
          id: img.id,
          url: img.image_url,
          is_primary: img.is_primary
        })) || []
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name_en')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleImageLink = (url: string) => {
    const newImage = {
      id: Date.now().toString() + Math.random(),
      url: url,
      is_primary: formData.images.length === 0
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }))
  }

  const handleRemoveImage = (imageId: string) => {
    setFormData(prev => {
      const newImages = prev.images.filter(img => img.id !== imageId)
      // If we removed the primary image, make the first one primary
      if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
        newImages[0].is_primary = true
      }
      return {
        ...prev,
        images: newImages
      }
    })
  }

  const handleSetPrimaryImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
    }))
  }

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        key_health_benefits: [...prev.key_health_benefits, benefitInput.trim()]
      }))
      setBenefitInput('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_health_benefits: prev.key_health_benefits.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validation
      if (!formData.name_en.trim()) {
        toast.error('Product name (English) is required')
        setSaving(false)
        return
      }

      if (!formData.current_price || parseFloat(formData.current_price) <= 0) {
        toast.error('Current price must be greater than 0')
        setSaving(false)
        return
      }

      if (!formData.category_id) {
        toast.error('Category is required')
        setSaving(false)
        return
      }

      // Calculate discount percentage if not provided
      let discountPercentage = formData.discount_percentage
      if (!discountPercentage && formData.old_price && formData.current_price) {
        const oldPrice = parseFloat(formData.old_price)
        const currentPrice = parseFloat(formData.current_price)
        if (oldPrice > currentPrice) {
          discountPercentage = Math.round(((oldPrice - currentPrice) / oldPrice) * 100).toString()
        }
      }

      // Only use image URLs (no upload to storage)
      const uploadedImages = formData.images.map(image => ({
        image_url: image.url,
        is_primary: image.is_primary
      }))

      // Update product
      const { data: updatedProduct, error: productError } = await supabaseAdmin
        .from('products')
        .update({
          name_en: formData.name_en.trim(),
          name_bn: formData.name_bn?.trim() || null,
          description: formData.description?.trim() || null,
          current_price: parseFloat(formData.current_price),
          old_price: formData.old_price ? parseFloat(formData.old_price) : null,
          discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          unit: formData.unit,
          unit_type: formData.unit_type,
          category_id: formData.category_id,
          status: formData.status,
          key_health_benefits: formData.key_health_benefits,
          nutritional_info: formData.nutritional_info ? JSON.parse(formData.nutritional_info) : null,
          dosage_and_usage: formData.dosage_and_usage?.trim() || null,
          is_featured: formData.is_featured
        })
        .eq('id', productId)
        .select()
        .single()

      if (productError) throw productError

      // Delete existing images and insert new ones
      await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      // Insert new images
      if (uploadedImages.length > 0) {
        const { error: imagesError } = await supabaseAdmin
          .from('product_images')
          .insert(
            uploadedImages.map(img => ({
              product_id: productId,
              image_url: img.image_url,
              is_primary: img.is_primary
            }))
          )

        if (imagesError) throw imagesError
      }

      toast.success('Product updated successfully!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Product not found</h2>
        <button
          onClick={() => router.push('/admin/products')}
          className="text-primary hover:text-primary/80"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name (Bangla)
              </label>
              <input
                type="text"
                name="name_bn"
                value={formData.name_bn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="পণ্যের নাম"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Price *
              </label>
              <input
                type="number"
                name="current_price"
                value={formData.current_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Old Price
              </label>
              <input
                type="number"
                name="old_price"
                value={formData.old_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Percentage
              </label>
              <input
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 250g, 500ml, 1pc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit Type
              </label>
              <select
                name="unit_type"
                value={formData.unit_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="solid">Solid</option>
                <option value="liquid">Liquid</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category and Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Category & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_en} {category.name_bn && `(${category.name_bn})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="new_arrival">New Arrival</option>
                <option value="best_selling">Best Selling</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
              />
              <label htmlFor="is_featured" className="ml-2 text-sm text-gray-300">
                Show in featured products carousel
              </label>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Product Images</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Add image URLs for the product. First image will be primary.
            </p>
            <div className="flex space-x-2 mb-4">
              <input
                type="url"
                placeholder="Enter image URL"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement
                    if (input.value.trim()) {
                      handleImageLink(input.value.trim())
                      input.value = ''
                    }
                  }
                }}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[type="url"]') as HTMLInputElement
                  if (input?.value.trim()) {
                    handleImageLink(input.value.trim())
                    input.value = ''
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Image Preview */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt="Product preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {image.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-primary text-white rounded-full">
                      Primary
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!image.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(image.id)}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                        title="Set as primary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Benefits */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Key Health Benefits</h2>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="Enter a health benefit"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.key_health_benefits.length > 0 && (
              <div className="space-y-2">
                {formData.key_health_benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-lg">
                    <span className="text-gray-300">{benefit}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nutritional Info (JSON)
              </label>
              <textarea
                name="nutritional_info"
                value={formData.nutritional_info}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder='{"calories": 100, "protein": 2}'
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dosage and Usage
              </label>
              <textarea
                name="dosage_and_usage"
                value={formData.dosage_and_usage}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter dosage and usage instructions"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
