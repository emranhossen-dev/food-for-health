'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'
import AIDataGenerator from './AIDataGenerator'

interface Category {
  id: string
  name_en: string
  name_bn?: string
}

interface ProductVariant {
  id: string
  quantity_option: string
  quantity_type: 'weight' | 'volume' | 'pieces'
  current_price: string
  old_price: string
  discount_percentage: string
  pricing_type: 'fix' | 'discount'
  stock_quantity: string
  is_default: boolean
  sort_order: number
}

interface ProductFormData {
  name_en: string
  name_bn: string
  description: string
  current_price: string
  old_price: string
  discount_percentage: string
  has_discount: boolean
  stock_quantity: string
  unit: string
  unit_type: string
  category_id: string
  status: string
  key_health_benefits: string[]
  nutritional_info: string
  dosage_and_usage: string
  is_featured: boolean
  slug: string
  images: any[]
  variants: ProductVariant[]
  selected_units: {
    gm: boolean
    ml: boolean
    L: boolean
    kg: boolean
    pc: boolean
  }
}

export default function AddProductFormClean() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'link'>('link')
  const [benefitInput, setBenefitInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: '',
    name_bn: '',
    description: '',
    current_price: '',
    old_price: '',
    discount_percentage: '',
    has_discount: false,
    stock_quantity: '',
    unit: '',
    unit_type: 'solid',
    category_id: '',
    status: 'none',
    key_health_benefits: [],
    nutritional_info: '',
    dosage_and_usage: '',
    is_featured: false,
    slug: '',
    images: [],
    variants: [],
    selected_units: {
      gm: false,
      ml: false,
      L: false,
      kg: false,
      pc: false
    }
  })

  // Bulk upload state
  const [uploadMode, setUploadMode] = useState<'manual' | 'bulk'>('manual')
  const [bulkData, setBulkData] = useState('')
  const [bulkJsonData, setBulkJsonData] = useState('')
  const [bulkProducts, setBulkProducts] = useState<any[]>([])
  const [uploadFormat, setUploadFormat] = useState<'csv' | 'json'>('csv')
  const [bulkInstruction, setBulkInstruction] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
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

  const handleClearForm = () => {
    setFormData(prev => ({
      name_en: '',
      name_bn: '',
      description: '',
      current_price: '',
      old_price: '',
      discount_percentage: '',
      has_discount: false,
      stock_quantity: '',
      unit: '',
      unit_type: 'solid',
      category_id: '',
      status: 'none',
      key_health_benefits: [],
      nutritional_info: '',
      dosage_and_usage: '',
      is_featured: false,
      slug: '',
      images: [],
      variants: [],
      selected_units: {
        gm: false,
        ml: false,
        L: false,
        kg: false,
        pc: false
      }
    }))
    toast.success('Form cleared successfully!')
  }

  const handleAIDataGenerated = (aiData: any) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description || aiData.description,
      name_bn: prev.name_bn || aiData.name_bn,
      current_price: prev.current_price || aiData.current_price,
      category_id: prev.category_id || aiData.category_id,
      key_health_benefits: prev.key_health_benefits.length > 0 ? prev.key_health_benefits : aiData.key_health_benefits,
      nutritional_info: prev.nutritional_info || aiData.nutritional_info,
      dosage_and_usage: prev.dosage_and_usage || aiData.dosage_and_usage,
      unit: prev.unit || aiData.unit,
      unit_type: prev.unit_type || aiData.unit_type
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
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

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:')
    if (url) {
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

  const checkDuplicateName = async (name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('name_en', name)
        .single()

      return !error && data !== null
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name_en.trim()) {
      toast.error('Product name is required')
      return
    }

    if (!formData.category_id) {
      toast.error('Please select a category')
      return
    }

    if (formData.images.length === 0) {
      toast.error('Please add at least one product image')
      return
    }

    // Check for duplicate product name
    const isDuplicate = await checkDuplicateName(formData.name_en)
    if (isDuplicate) {
      toast.error('A product with this name already exists')
      return
    }

    setLoading(true)
    try {
      // Generate slug
      const productSlug = formData.slug || generateSlug(formData.name_en)

      // Create product
      const { data: newProduct, error: productError } = await supabaseAdmin
        .from('products')
        .insert({
          name_en: formData.name_en,
          name_bn: formData.name_bn || null,
          description: formData.description || null,
          current_price: parseFloat(formData.current_price) || 0,
          old_price: formData.old_price ? parseFloat(formData.old_price) : null,
          discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
          has_discount: formData.has_discount,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          unit: formData.unit,
          unit_type: formData.unit_type,
          category_id: formData.category_id,
          status: formData.status,
          key_health_benefits: formData.key_health_benefits.length > 0 ? formData.key_health_benefits : null,
          nutritional_info: formData.nutritional_info || null,
          dosage_and_usage: formData.dosage_and_usage || null,
          is_featured: formData.is_featured,
          slug: productSlug
        })
        .select()
        .single()

      if (productError) throw productError

      toast.success('Product added successfully!')
      
      // Reset form
      handleClearForm()
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
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
              />
            </div>
          </div>

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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_en} {category.name_bn && `(${category.name_bn})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* AI Data Generator */}
        <AIDataGenerator
          productName={formData.name_en}
          selectedCategory={formData.category_id}
          categories={categories}
          onAIDataGenerated={handleAIDataGenerated}
          loading={aiLoading}
          setLoading={setAiLoading}
        />

        {/* Clear and Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear Form
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}