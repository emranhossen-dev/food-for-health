'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name_en: string
  name_bn?: string
}

interface ProductFormData {
  name_en: string
  name_bn: string
  description: string
  current_price: string
  old_price: string
  discount_percentage: string
  stock_quantity: string
  unit: string
  unit_type: 'solid' | 'liquid' | 'quantity'
  category_id: string
  status: 'none' | 'new_arrival' | 'best_selling' | 'featured'
  key_health_benefits: string[]
  nutritional_info: string
  dosage_and_usage: string
  is_featured: boolean
  images: Array<{
    id: string
    url: string
    file?: File
    is_primary: boolean
  }>
}

export default function AddProductForm() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'link'>('link')
  const [benefitInput, setBenefitInput] = useState('')
  
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: '',
    name_bn: '',
    description: '',
    current_price: '',
    old_price: '',
    discount_percentage: '',
    stock_quantity: '',
    unit: '',
    unit_type: 'solid',
    category_id: '',
    status: 'none',
    key_health_benefits: [],
    nutritional_info: '',
    dosage_and_usage: '',
    is_featured: false,
    images: []
  })

  useEffect(() => {
    fetchCategories()
  }, [])

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
      toast.error('Failed to fetch categories: ' + (error as Error).message)
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage = {
          id: Date.now().toString() + Math.random(),
          url: event.target?.result as string,
          file: file,
          is_primary: formData.images.length === 0
        }
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }))
      }
      reader.readAsDataURL(file)
    })
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

  const removeImage = (imageId: string) => {
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

  const setPrimaryImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
    }))
  }

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        key_health_benefits: [...prev.key_health_benefits, benefitInput.trim()]
      }))
      setBenefitInput('')
    }
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_health_benefits: prev.key_health_benefits.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name_en || !formData.current_price || !formData.category_id || !formData.unit) {
        toast.error('Please fill all required fields')
        return
      }

      if (formData.images.length === 0) {
        toast.error('Please add at least one product image')
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

      // Create product
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .insert({
          name_en: formData.name_en,
          name_bn: formData.name_bn || null,
          description: formData.description || null,
          current_price: parseFloat(formData.current_price),
          old_price: formData.old_price ? parseFloat(formData.old_price) : null,
          discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          unit: formData.unit,
          unit_type: formData.unit_type,
          category_id: formData.category_id,
          status: formData.status,
          key_health_benefits: formData.key_health_benefits.length > 0 ? formData.key_health_benefits : null,
          nutritional_info: formData.nutritional_info || null,
          dosage_and_usage: formData.dosage_and_usage || null,
          is_featured: formData.is_featured
        })
        .select()
        .single()

      if (productError) throw productError

      // Insert product images
      const { error: imagesError } = await supabaseAdmin
        .from('product_images')
        .insert(
          uploadedImages.map(img => ({
            product_id: product.id,
            image_url: img.image_url,
            is_primary: img.is_primary
          }))
        )

      if (imagesError) throw imagesError

      toast.success('Product added successfully!')
      
      // Reset form
      setFormData({
        name_en: '',
        name_bn: '',
        description: '',
        current_price: '',
        old_price: '',
        discount_percentage: '',
        stock_quantity: '',
        unit: '',
        unit_type: 'solid',
        category_id: '',
        status: 'none',
        key_health_benefits: [],
        nutritional_info: '',
        dosage_and_usage: '',
        is_featured: false,
        images: []
      })

    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Add New Product</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Name (English) *
            </label>
            <input
              type="text"
              name="name_en"
              value={formData.name_en}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bengali"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Price *
            </label>
            <input
              type="number"
              name="current_price"
              value={formData.current_price}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            />
          </div>
        </div>

        {/* Stock and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unit Type *
            </label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="solid">Solid (Weight)</option>
              <option value="liquid">Liquid (Volume)</option>
              <option value="quantity">Quantity (Pieces)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unit *
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              placeholder={formData.unit_type === 'solid' ? 'e.g., 250g, 500g, 1kg' : formData.unit_type === 'liquid' ? 'e.g., 250ml, 500ml, 1L' : 'e.g., 1pc, 3pcs, 5pcs'}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Category and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
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
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_featured"
            id="is_featured"
            checked={formData.is_featured}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-300">
            Show in featured products carousel
          </label>
        </div>

        {/* Key Health Benefits */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Key Health Benefits
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              placeholder="Add a health benefit"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addBenefit}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {formData.key_health_benefits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.key_health_benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="ml-2 text-primary hover:text-primary/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Nutritional Info */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nutritional Information
          </label>
          <textarea
            name="nutritional_info"
            value={formData.nutritional_info}
            onChange={handleInputChange}
            rows={3}
            placeholder="e.g., Calories: 50, Protein: 2g, Fiber: 3g per 100g"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Dosage and Usage */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dosage and Usage
          </label>
          <textarea
            name="dosage_and_usage"
            value={formData.dosage_and_usage}
            onChange={handleInputChange}
            rows={2}
            placeholder="e.g., Take 1-2 tablets daily after meals"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Product Images */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Product Images *
          </label>
          
          {/* Image Links */}
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
                  const input = document.querySelector('input[placeholder="Enter image URL"]') as HTMLInputElement
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
                        onClick={() => setPrimaryImage(image.id)}
                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                        title="Set as primary"
                      >
                        <span className="text-xs">⭐</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-red-50"
                      title="Remove image"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
