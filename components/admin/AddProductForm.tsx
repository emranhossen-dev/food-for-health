'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Plus, Trash2, Bot, FileSpreadsheet } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

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
  pricing_type: 'discount' | 'fix'
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
  unit_type: 'solid' | 'liquid' | 'quantity'
  category_id: string
  status: 'none' | 'new_arrival' | 'best_selling' | 'featured'
  key_health_benefits: string[]
  nutritional_info: string
  dosage_and_usage: string
  is_featured: boolean
  slug: string
  images: Array<{
    id: string
    url: string
    file?: File
    is_primary: boolean
  }>
  variants: ProductVariant[]
  selected_units: {
    gm: boolean
    ml: boolean
    L: boolean
    kg: boolean
    pc: boolean
  }
}

export default function AddProductForm() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [imageSource, setImageSource] = useState<'upload' | 'link'>('link')
  const [benefitInput, setBenefitInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'manual' | 'bulk'>('manual')
  const [bulkData, setBulkData] = useState('')
  const [bulkJsonData, setBulkJsonData] = useState('')
  const [bulkProducts, setBulkProducts] = useState<any[]>([])
  const [uploadFormat, setUploadFormat] = useState<'csv' | 'json'>('csv')
  const [bulkInstruction, setBulkInstruction] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
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
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  const checkDuplicateName = async (name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('name_en', name)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error
      }

      return !!data // Return true if product exists
    } catch (error) {
      console.error('Error checking duplicate name:', error)
      return false
    }
  }

  const calculatePriceDiscount = (currentPrice: string, oldPrice: string, discountPercentage: string) => {
    const current = parseFloat(currentPrice) || 0
    const old = parseFloat(oldPrice) || 0
    const discount = parseFloat(discountPercentage) || 0

    if (current > 0 && old > 0 && !discountPercentage) {
      // Calculate discount percentage from prices
      return Math.round(((old - current) / old) * 100).toString()
    } else if (old > 0 && discount > 0 && !currentPrice) {
      // Calculate current price from old price and discount
      return (old * (1 - discount / 100)).toFixed(2)
    } else if (current > 0 && discount > 0 && !oldPrice) {
      // Calculate old price from current price and discount
      return (current / (1 - discount / 100)).toFixed(2)
    }
    
    return discountPercentage
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
      setFormData(prev => {
        const updated = {
          ...prev,
          [name]: value
        }
        
        // Always auto-generate slug when product name changes
        if (name === 'name_en') {
          updated.slug = generateSlug(value)
        }
        
        // Auto-calculate prices based on discount option
        if (name === 'current_price' || name === 'old_price' || name === 'discount_percentage') {
          if (prev.has_discount) {
            // Discount mode: calculate current price from old price and discount percentage
            if (name === 'old_price' && value && prev.discount_percentage) {
              updated.current_price = calculatePriceDiscount('', value, prev.discount_percentage)
            } else if (name === 'discount_percentage' && value && prev.old_price) {
              updated.current_price = calculatePriceDiscount('', prev.old_price, value)
            }
            // Clear current price if it was manually entered in discount mode
            if (name === 'current_price') {
              updated.current_price = ''
            }
          } else {
            // No discount mode: calculate discount percentage from old and current prices
            if (name === 'old_price' && value && prev.current_price) {
              updated.discount_percentage = calculatePriceDiscount(prev.current_price, value, '')
            } else if (name === 'current_price' && value && prev.old_price) {
              updated.discount_percentage = calculatePriceDiscount(value, prev.old_price, '')
            }
            // Clear discount percentage if it was manually entered in no-discount mode
            if (name === 'discount_percentage') {
              updated.discount_percentage = ''
            }
          }
        }

        // Handle discount checkbox toggle
        if (name === 'has_discount') {
          const hasDiscount = (e.target as HTMLInputElement).checked
          if (hasDiscount) {
            // Switching to discount mode: clear current price
            updated.current_price = ''
          } else {
            // Switching to no discount mode: clear discount percentage
            updated.discount_percentage = ''
          }
        }
        
        return updated
      })
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

  const addVariant = () => {
    // Get selected units
    const selectedUnits = Object.entries(formData.selected_units)
      .filter(([_, selected]) => selected)
      .map(([unit, _]) => unit)

    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit first')
      return
    }

    // Use the first selected unit for the new variant
    const firstUnit = selectedUnits[0]
    
    // Determine quantity type
    let quantityType: 'weight' | 'volume' | 'pieces' = 'pieces'
    if (firstUnit === 'gm' || firstUnit === 'kg') {
      quantityType = 'weight'
    } else if (firstUnit === 'ml' || firstUnit === 'L') {
      quantityType = 'volume'
    }

    // Get predefined quantities for the first unit
    const predefinedQuantities = getPredefinedQuantities(firstUnit)
    
    // Find the next quantity option that hasn't been used yet
    const usedQuantities = formData.variants.map(v => v.quantity_option)
    const nextQuantity = predefinedQuantities.find(q => !usedQuantities.includes(q)) || predefinedQuantities[0]

    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      quantity_option: nextQuantity,
      quantity_type: quantityType,
      current_price: '',
      old_price: '',
      discount_percentage: '',
      pricing_type: 'fix',
      stock_quantity: '0',
      is_default: formData.variants.length === 0, // First variant is default
      sort_order: formData.variants.length
    }
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }))
  }

  const getPredefinedQuantities = (unit: string): string[] => {
    switch (unit) {
      case 'gm':
        return ['25gm', '50gm', '100gm', '250gm', '500gm']
      case 'kg':
        return ['0.5kg', '1kg', '2kg', '3kg', '5kg']
      case 'ml':
        return ['50ml', '100ml', '250ml', '500ml', '750ml']
      case 'L':
        return ['0.5L', '1L', '2L', '3L', '5L']
      case 'pc':
        return ['1pc', '2pc', '3pc', '5pc', '10pc']
      default:
        return []
    }
  }

  const removeVariant = (variantId: string) => {
    setFormData(prev => {
      const newVariants = prev.variants.filter(v => v.id !== variantId)
      
      // If we removed the default variant, make the first one default
      if (newVariants.length > 0 && !newVariants.some(v => v.is_default)) {
        newVariants[0].is_default = true
      }
      
      return {
        ...prev,
        variants: newVariants
      }
    })
  }

  const updateVariant = (variantId: string, field: keyof ProductVariant, value: any) => {
    setFormData(prev => {
      let newVariants = prev.variants.map(variant => {
        if (variant.id === variantId) {
          const updated = { ...variant, [field]: value }
          
          // Auto-calculate prices for variants
          if (field === 'current_price' || field === 'old_price' || field === 'discount_percentage') {
            if (variant.pricing_type === 'discount') {
              // Discount mode: calculate current price from old price and discount percentage
              if (field === 'old_price' && value && variant.discount_percentage) {
                updated.current_price = calculatePriceDiscount('', value, variant.discount_percentage)
              } else if (field === 'discount_percentage' && value && variant.old_price) {
                updated.current_price = calculatePriceDiscount('', variant.old_price, value)
              }
              // Clear current price if it was manually entered in discount mode
              if (field === 'current_price') {
                updated.current_price = ''
              }
            } else {
              // Fix mode: only use current price, clear discount fields
              if (field === 'discount_percentage') {
                updated.discount_percentage = ''
              }
              if (field === 'old_price') {
                updated.old_price = ''
              }
            }
          }
          
          // Handle pricing type change for variants
          if (field === 'pricing_type') {
            if (value === 'discount') {
              // Switching to discount mode: clear current price
              updated.current_price = ''
            } else {
              // Switching to fix mode: clear discount fields
              updated.discount_percentage = ''
              updated.old_price = ''
            }
          }
          
          return updated
        }
        return variant
      })

      // Handle default variant logic separately
      if (field === 'is_default' && value === true) {
        newVariants = newVariants.map(v => ({ ...v, is_default: v.id === variantId }))
      }

      return {
        ...prev,
        variants: newVariants
      }
    })
  }

  const setDefaultVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant => ({
        ...variant,
        is_default: variant.id === variantId
      }))
    }))
  }

  const handleUnitCheckboxChange = (unit: keyof typeof formData.selected_units) => {
    const newValue = !formData.selected_units[unit]
    
    setFormData(prev => {
      const updatedSelectedUnits = {
        ...prev.selected_units,
        [unit]: newValue
      }
      
      // If this is the first unit being selected and there are no variants yet, auto-fill the first variant
      const selectedUnits = Object.entries(updatedSelectedUnits)
        .filter(([_, selected]) => selected)
        .map(([unit, _]) => unit)
      
      let updatedVariants = prev.variants
      
      if (selectedUnits.length === 1 && prev.variants.length === 0) {
        // Auto-create first variant with the selected unit
        const firstUnit = selectedUnits[0]
        let quantityType: 'weight' | 'volume' | 'pieces' = 'pieces'
        if (firstUnit === 'gm' || firstUnit === 'kg') {
          quantityType = 'weight'
        } else if (firstUnit === 'ml' || firstUnit === 'L') {
          quantityType = 'volume'
        }
        
        const predefinedQuantities = getPredefinedQuantities(firstUnit)
        const firstQuantity = predefinedQuantities[0]
        
        const firstVariant: ProductVariant = {
          id: Date.now().toString(),
          quantity_option: firstQuantity,
          quantity_type: quantityType,
          current_price: '',
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix',
          stock_quantity: '0',
          is_default: true,
          sort_order: 0
        }
        
        updatedVariants = [firstVariant]
      } else if (selectedUnits.length === 0 && prev.variants.length > 0) {
        // If all units are deselected, clear variants
        updatedVariants = []
      }
      
      return {
        ...prev,
        selected_units: updatedSelectedUnits,
        variants: updatedVariants
      }
    })
  }

  const getQuantityPlaceholder = () => {
    const selectedUnits = Object.entries(formData.selected_units)
      .filter(([_, selected]) => selected)
      .map(([unit, _]) => unit)

    if (selectedUnits.length === 0) {
      return 'e.g., 1kg, 500g, 1L, 500ml, 1pc'
    }

    const placeholders = []
    if (selectedUnits.includes('kg')) placeholders.push('1kg, 500kg')
    if (selectedUnits.includes('gm')) placeholders.push('500gm, 250gm')
    if (selectedUnits.includes('L')) placeholders.push('1L, 2L')
    if (selectedUnits.includes('ml')) placeholders.push('500ml, 250ml')
    if (selectedUnits.includes('pc')) placeholders.push('1pc, 3pcs')

    return `e.g., ${placeholders.slice(0, 2).join(', ')}`
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

  const generateProductImages = (productName: string, category: string) => {
    // Generate realistic product image URLs based on product type
    const imageUrls = []
    
    if (productName.includes('milk') || category.includes('dairy')) {
      imageUrls.push(
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1550989460-39adf01451bb?w=800&h=600&fit=crop'
      )
    } else if (productName.includes('fruit') || category.includes('fruit')) {
      imageUrls.push(
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&h=600&fit=crop'
      )
    } else if (productName.includes('vitamin') || productName.includes('supplement')) {
      imageUrls.push(
        'https://images.unsplash.com/photo-1606339918617-08df3246d41f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
      )
    } else if (productName.includes('honey') || productName.includes('organic')) {
      imageUrls.push(
        'https://images.unsplash.com/photo-1587049352846-3a273ba261c6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1607623814075-e37df9355c9a?w=800&h=600&fit=crop'
      )
    } else {
      // Default product images
      imageUrls.push(
        'https://images.unsplash.com/photo-1542826658-752c917ea262?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1568901346406-7a3b5453a5b8?w=800&h=600&fit=crop'
      )
    }

    return imageUrls.map((url, index) => ({
      id: Date.now().toString() + index,
      url: url,
      is_primary: index === 0
    }))
  }

  const generateProductVariants = (unitType: string, basePrice: string) => {
    const variants = []
    const price = parseFloat(basePrice) || 100

    if (unitType === 'solid') {
      variants.push(
        {
          id: Date.now().toString() + '1',
          quantity_option: '250g',
          quantity_type: 'weight' as const,
          current_price: (price * 0.5).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '50',
          is_default: true,
          sort_order: 0
        },
        {
          id: Date.now().toString() + '2',
          quantity_option: '500g',
          quantity_type: 'weight' as const,
          current_price: price.toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '30',
          is_default: false,
          sort_order: 1
        },
        {
          id: Date.now().toString() + '3',
          quantity_option: '1kg',
          quantity_type: 'weight' as const,
          current_price: (price * 1.8).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '20',
          is_default: false,
          sort_order: 2
        }
      )
    } else if (unitType === 'liquid') {
      variants.push(
        {
          id: Date.now().toString() + '1',
          quantity_option: '250ml',
          quantity_type: 'volume' as const,
          current_price: (price * 0.3).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '40',
          is_default: true,
          sort_order: 0
        },
        {
          id: Date.now().toString() + '2',
          quantity_option: '500ml',
          quantity_type: 'volume' as const,
          current_price: (price * 0.6).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '25',
          is_default: false,
          sort_order: 1
        },
        {
          id: Date.now().toString() + '3',
          quantity_option: '1L',
          quantity_type: 'volume' as const,
          current_price: price.toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '15',
          is_default: false,
          sort_order: 2
        }
      )
    } else {
      variants.push(
        {
          id: Date.now().toString() + '1',
          quantity_option: '1pc',
          quantity_type: 'pieces' as const,
          current_price: price.toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '100',
          is_default: true,
          sort_order: 0
        },
        {
          id: Date.now().toString() + '2',
          quantity_option: '3pcs',
          quantity_type: 'pieces' as const,
          current_price: (price * 2.5).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '50',
          is_default: false,
          sort_order: 1
        },
        {
          id: Date.now().toString() + '3',
          quantity_option: '5pcs',
          quantity_type: 'pieces' as const,
          current_price: (price * 4).toFixed(2),
          old_price: '',
          discount_percentage: '',
          pricing_type: 'fix' as const,
          stock_quantity: '30',
          is_default: false,
          sort_order: 2
        }
      )
    }

    return variants
  }

  const getSelectedUnitsFromVariants = (variants: any[]) => {
    const units = {
      gm: false,
      ml: false,
      L: false,
      kg: false,
      pc: false
    }

    variants.forEach(variant => {
      if (variant.quantity_option.includes('gm')) units.gm = true
      if (variant.quantity_option.includes('kg')) units.kg = true
      if (variant.quantity_option.includes('ml')) units.ml = true
      if (variant.quantity_option.includes('L')) units.L = true
      if (variant.quantity_option.includes('pc')) units.pc = true
    })

    return units
  }

  const handleAiFill = async () => {
    if (!formData.name_en.trim()) {
      toast.error('Please enter a product name first')
      return
    }

    setAiLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock AI data based on product name
      const productName = formData.name_en.toLowerCase()
      const category = categories.find(c => c.id === formData.category_id)?.name_en || ''
      
      let mockAiData = {
        description: `আমাদের প্রিমিয়াম মানের ${formData.name_en} এর অসাধারণ গুণমান উপভোগ করুন, যা সর্বোচ্চ পুষ্টিমূল্য এবং তাজাত্ব বজায় রাখার জন্য সাবধানতভাবে সংগ্রহ এবং প্রক্রিয়াজাত করা হয়েছে। এই পণ্যটি ঐতিহ্যগত জ্ঞান এবং আধুনিক মান মানের মধ্যে নিখুঁত ভারসাম্য প্রতিনিধিত্ব করে, নিশ্চিত করে যে আপনি আপনার স্বাস্থ্য এবং সুস্থতা যাত্রার জন্য সেরাটাই পাচ্ছেন। প্রতিটি ব্যাচ বিশুদ্ধতা, শক্তি এবং নিরাপত্তা নিশ্চিত করার জন্য কঠোর পরীক্ষার মধ্য দিয়ে যায়, যা স্বাস্থ্য-সচেতন ব্যক্তিদের জন্য একটি নির্ভরযোগ্য পছন্দ করে তোলে। প্রাকৃতিক গঠন অনুকূল শোষণ এবং কার্যকারিতা নিশ্চিত করে, আপনার শরীরকে প্রয়োজনীয় পুষ্টি সরবরাহ করে যা সমৃদ্ধ হওয়ার জন্য প্রয়োজনীয়। আপনার দৈনন্দিন রুটিনে এই পণ্যটি অন্তর্ভুক্ত করে মান এবং যত্ন আপনার সামগ্রিক সুস্থতায় কী পার্থক্য আনতে পারে তা অনুভব করুন।`,
        name_bn: formData.name_en,
        current_price: '',
        category_id: '',
        key_health_benefits: ['প্রয়োজনীয় পুষ্টিতে সমৃদ্ধ', 'সামগ্রিক স্বাস্থ্য এবং সুস্থতাকে সমর্থন করে', 'প্রাকৃতিক উপাদান দিয়ে তৈরি', 'ক্ষতিকারক সংযোজন থেকে মুক্ত', 'সর্বোত্তম সুবিধার জন্য বৈজ্ঞানিকভাবে তৈরি'],
        nutritional_info: 'উচ্চ বাযোজ্যতা সহ প্রিমিয়াম প্রাকৃতিক উপাদান, প্রয়োজনীয় ভিটামিন এবং খনিজ, অ্যান্টিঅক্সিডেন্ট এবং উপকারী যৌগিক রয়েছে। কৃত্রিম সংরক্ষণকারী, রঙ এবং ফ্লেভার থেকে মুক্ত। নন-জিএমও, গ্লুটেন-মুক্ত, এবং বিভিন্ন খাদ্যাভ্যাসের জন্য উপযুক্ত।',
        dosage_and_usage: 'সর্বোত্তম ফলাফলের জন্য, আপনার দৈনিক সুস্থতা রুটিনে এই পণ্যটি অন্তর্ভুক্ত করুন। ভারসাম্যপূর্ণ খাদ্য এবং স্বাস্থ্যকর জীবনধারার অংশ হিসাবে ধারাবাহিকভাবে ব্যবহার করুন। তাজাত্ব এবং শক্তি বজায় রাখার জন্য সরাসরি সূর্যালোক থেকে দূরে একটি শীতল, শুষ্ক স্থানে সংরক্ষণ করুন।',
        unit: '500g',
        unit_type: 'solid'
      }

      // Customize based on product type with detailed descriptions
      if (productName.includes('milk') || productName.includes('dairy') || category.toLowerCase().includes('dairy')) {
        mockAiData = {
          ...mockAiData,
          description: `আমাদের তাজা ${formData.name_en} এর বিশুদ্ধ ক্রিমি মিষ্টি উপভোগ করুন, যা সাবধানতভাবে নির্বাচিত স্থানীয় খামার থেকে সংগ্রহ করা হয়েছে যেখানে পশুকল্যাণ এবং টেকসই অনুশীলনের প্রতি অগ্রাধিকার দেওয়া হয়। এই প্রিমিয়াম দুগ্ধজাতীয় পণ্যটি সর্বনিম্ন প্রক্রিয়াকরণের মধ্য দিয়ে যায় এর প্রাকৃতিক পুষ্টির প্রোফাইল সংরক্ষণ করার জন্য, ক্যালসিয়াম, প্রোটিন এবং ভিটামিন সরবরাহ করে তাদের সবচেয়ে বাযোজ্য আকারে। প্রতিটি গ্লাস হাড়ের স্বাস্থ্য, পেশী বিকাশ এবং সামগ্রিক সুস্থতার জন্য পুষ্টির একটি শক্তিশালী উৎস প্রদান করে, যা ক্রমবর্ধমান শিশু এবং প্রাপ্তবয়স্কদের জন্য একটি চমৎকার পছন্দ। নরম পাস্তুরাইজেশন প্রক্রিয়া নিরাপত্তা নিশ্চিত করার সময় তাজা, প্রাকৃতিক স্বাদ বজায় রাখে যা দুগ্ধপ্রেমীরা প্রশংসা করে। পান করার, রান্না করার বা আপনার প্রিয় রেসিপিতে যোগ করার জন্য উপযুক্ত, এই বহুমুখী পণ্যটি আপনার টেবিলে পুষ্টি এবং সুস্বাদ উভয়ই নিয়ে আসে।`,
          name_bn: formData.name_en.includes('milk') ? 'দুধ' : formData.name_en.includes('cheese') ? 'পনির' : formData.name_en.includes('yogurt') ? 'দই' : formData.name_en.includes('butter') ? 'মাখন' : formData.name_en,
          current_price: '85',
          category_id: categories.find(c => c.name_en.toLowerCase().includes('dairy'))?.id || '',
          key_health_benefits: ['শক্তিশালী হাড় এবং দাঁতের জন্য ক্যালসিয়ামের উৎকৃষ্ট উৎস', 'পেশী বৃদ্ধি এবং মেরামতের জন্য উচ্চমানের প্রোটিন', 'উন্নত ক্যালসিয়াম শোষণের জন্য ভিটামিন ডি-তে সমৃদ্ধ', 'শক্তি বিপাকের জন্য প্রয়োজনীয় বি ভিটামিন রয়েছে', 'ইমিউন সিস্টেমের কার্যকারিতা এবং সামগ্রিক স্বাস্থ্যকে সমর্থন করে'],
          nutritional_info: 'প্রতি 250ml এর জন্য: ক্যালসিয়াম 300mg, প্রোটিন 8g, ভিটামিন ডি 120IU, ভিটামিন বি12 1.2mcg, ফসফরাস 250mg, পটাসিয়াম 380mg। প্রাকৃতিকভাবে ল্যাকটোজ রয়েছে, কোনো কৃত্রিম সংযোজন বা সংরক্ষণকারী নেই।',
          dosage_and_usage: 'ভারসাম্যপূর্ণ খাদ্যের অংশ হিসাবে দৈনিক 1-2 গ্লাস উপভোগ করুন। সকালের নাস্তায় সিরিয়ালের সাথে, স্মুদিতে বা তাজা পানীয় হিসাবে উপযুক্ত। রেফ্রিজারেটেড সংরক্ষণ করুন এবং সেরা মানের জন্য খোলার 5 দিনের মধ্যে সেবন করুন।',
          unit: '1L',
          unit_type: 'liquid'
        }
      } else if (productName.includes('fruit') || category.toLowerCase().includes('fruit')) {
        mockAiData = {
          ...mockAiData,
          description: `প্রকৃতির মিষ্টিতম উপহার আবিষ্কার করুন আমাদের প্রিমিয়াম ${formData.name_en} এর সাথে, যা সর্বোচ্চ স্বাদ এবং পুষ্টির সামগ্রী নিশ্চিত করার জন্য পরিপক্কতার সময় হাতে তোলা হয়। প্রতিটি ফল সাবধানতভাবে নির্বাচিত করা হয় বিশ্বস্ত চাষীদের কাছ থেকে যারা মান এবং টেকসইতার প্রতি আমাদের প্রতিশ্রুতি ভাগ করে, একটি পণ্য সরবরাহ করে যা গ্রহের জন্য যতই ভালো আপনার জন্য ততই ভালো। প্রাকৃতিক ভিটামিন, খনিজ এবং অ্যান্টিঅক্সিডেন্টে ভরপুর, এই ফলগুলি প্রয়োজনীয় পুষ্টি সরবরাহ করে যা আপনার শরীরের প্রতিরক্ষা ব্যবস্থাকে সমর্থন করে এবং সামগ্রিক প্রাণশক্তি বৃদ্ধি করে। প্রাকৃতিক মিষ্টি তা শিশু এবং প্রাপ্তবয়স্কদের জন্য একটি নিখুঁত স্বাস্থ্যকর স্ন্যাক করে তোলে, ক্ষুধা মেটানোর সময় মূল্যবান পুষ্টি প্রদান করে। তাজা, স্মুদিতে বা আপনার প্রিয় রেসিপিতে যোগ করে উপভোগ করুন আপনার খাবারে প্রাকৃতিক স্বাদ এবং স্বাস্থ্য সুবিধা যোগ করার জন্য।`,
          name_bn: 'ফল',
          current_price: '150',
          category_id: categories.find(c => c.name_en.toLowerCase().includes('fruit'))?.id || '',
          key_health_benefits: ['ইমিউন সমর্থনের জন্য ভিটামিন সি-তে ভরপুর', 'পরিপাক স্বাস্থ্যের জন্য ডায়েটারি ফাইবারে উচ্চ', 'সেলুলার ক্ষতি থেকে রক্ষা করে প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট', 'কম ক্যালোরিতে প্রয়োজনীয় পুষ্টিতে উচ্চ', 'যোগ করা চিনি ছাড়া প্রাকৃতিক শক্তি প্রদান করে'],
          nutritional_info: 'ভিটামিন সি, ডায়েটারি ফাইবার, প্রাকৃতিক চিনি, অ্যান্টিঅক্সিডেন্ট, ফ্ল্যাভোনয়েড এবং প্রয়োজনীয় খনিজে সমৃদ্ধ। প্রাকৃতিকভাবে ফ্যাট-ফ্রি এবং কোলেস্টেরল-ফ্রি, যা হৃদয়-স্বাস্থ্যকর খাদ্যের জন্য একটি চমৎকার পছন্দ।',
          dosage_and_usage: 'ভারসাম্যপূর্ণ খাদ্যের অংশ হিসাবে দৈনিক 1-2 পরিবেশন উপভোগ করুন। স্ন্যাকিং, সকালের নাস্তায় সিরিয়াল যোগ করার জন্য বা স্মুদিতে মিশ্রিত করার জন্য উপযুক্ত। কক্ষ তাপমাত্রায় সংরক্ষণ করুন এবং সর্বোত্তম তাজাত্বের জন্য 3-5 দিনের মধ্যে সেবন করুন।',
          unit: '500g',
          unit_type: 'solid'
        }
      } else if (productName.includes('vitamin') || productName.includes('supplement') || productName.includes('tablet')) {
        mockAiData = {
          ...mockAiData,
          description: `আমাদের উন্নত ${formData.name_en} দিয়ে আপনার সুস্থতা যাত্রা উন্নত করুন, যা কাটিং-জ গবেষণা এবং প্রিমিয়াম উপাদান ব্যবহার করে বৈজ্ঞানিকভাবে তৈরি করা হয়েছে আপনার স্বাস্থ্য লক্ষ্যমাত্রার জন্য সর্বোত্তম ফলাফল সরবরাহ করার জন্য। প্রতিটি ট্যাবলেটে প্রয়োজনীয় পুষ্টি, সহ-কারক এবং ভেষজ নির্যাসের একটি সাবধানতভাবে ভারসাম্যপূর্ণ মিশ্রণ রয়েছে যা সহযোগিকভাবে কাজ করে আপনার শরীরের প্রাকৃতিক কার্যকারিতাকে সমর্থন করতে এবং সামগ্রিক সুস্থতা প্রচার করতে। আমাদের উত্পাদন প্রক্রিয়া কঠোর মান নিয়ন্ত্রণ মান অনুসরণ করে, প্রতিটি ব্যাচে বিশুদ্ধতা, শক্তি এবং ধারাবাহিকতা নিশ্চিত করে। উন্নত ডেলিভারি সিস্টেম শোষণ এবং বাযোজ্যতা বৃদ্ধি করে, আপনার শরীরকে পুষ্টিগুলি আরও কার্যকরভাবে ব্যবহার করতে সাহায্য করে সর্বোত্তম সুবিধার জন্য। আপনার খাদ্যে পুষ্টির ঘাটতি পূরণ করতে এবং সর্বোত্তম স্বাস্থ্য এবং প্রাণশক্তির দিকে আপনার যাত্রায় সমর্থন করার জন্য এই সাপ্লিমেন্টের উপর আস্থা রাখুন।`,
          name_bn: 'ভিটামিন',
          current_price: '450',
          category_id: categories.find(c => c.name_en.toLowerCase().includes('supplement'))?.id || '',
          key_health_benefits: ['ইমিউন সিস্টেমের কার্যকারিতা এবং সহনশীলতা বৃদ্ধি করে', 'শক্তির মাত্রা বৃদ্ধি করে এবং ক্লান্তি কমায়', 'জ্ঞানীয় কার্যকারিতা এবং মানসিক স্পষ্টতাকে সমর্থন করে', 'স্বাস্থ্যকর বিপাক এবং পুষ্টি শোষণকে প্রচার করে', 'সেলুলার ক্ষতি থেকে অ্যান্টিঅক্সিডেন্ট সুরক্ষা প্রদান করে'],
          nutritional_info: 'প্রিমিয়াম ভিটামিন এ, সি, ডি, ই, কে, বি-কমপ্লেক্স, প্রয়োজনীয় খনিজ জিঙ্ক, সেলেনিয়াম, ম্যাগনেসিয়াম, ভেষজ নির্যাস এবং অ্যান্টিঅক্সিডেন্ট রয়েছে। কৃত্রিম রঙ, ফ্লেভার এবং সাধারণ অ্যালার্জেন থেকে মুক্ত।',
          dosage_and_usage: 'দৈনিক 1 ট্যাবলেট খাবারের সাথে, পছন্দভাবে সকালে সেবন করুন। সেরা ফলাফলের জন্য, কমপক্ষয়ে 3 মাস ধারাবাহিকভাবে ব্যবহার করুন। সরাসরি সূর্যালোক থেকে দূরে একটি শীতল, শুষ্ক স্থানে সংরক্ষণ করুন। শিশুদের নাগালের বাইরে রাখুন।',
          unit: '60 ট্যাবলেট',
          unit_type: 'solid'
        }
      } else if (productName.includes('honey') || productName.includes('organic')) {
        mockAiData = {
          ...mockAiData,
          description: `আমাদের বিশুদ্ধ, কাঁচা ${formData.name_en} এর সাথে প্রাকৃতিক মিষ্টি এবং স্বাস্থ্য সুবিধাগুলি উপভোগ করুন, যা সাবধানতভাবে নির্বাচিত ফুল থেকে সংগ্রহ করা হয় এবং কোনো তাপ প্রক্রিয়া ছাড়া প্রক্রিয়াজাত করা হয়েছে এর প্রাকৃতিক উপকারিতা সংরক্ষণ করার জন্য। আমাদের মৌমাছিরা বিভিন্ন বন্য ফুল এবং ভেষজ থেকে মধু সংগ্রহ করে, যা একটি জটিল স্বাদ এবং অসাধারণ পুষ্টিগুণ তৈরি করে। প্রাকৃতিক অ্যান্টিবায়োটিক, অ্যান্টিঅক্সিডেন্ট এবং অ্যান্টি-ইনফ্লামেটরি বৈশিষ্ট্যে ভরপুর, এই মধুটি শতাব্দী ধরে ঐতিহ্যগতভাবে স্বাস্থ্য সুবিধার জন্য ব্যবহৃত হয়েছে। সমৃদ্ধ, সোনালী এবং সুস্বাদু, এই মধুটি চা, টোস্ট, বা আপনার প্রিয় খাবারে একচেটিয়ে মিষ্টি যোগ করার জন্য উপযুক্ত।`,
          name_bn: 'মধু',
          current_price: '320',
          category_id: categories.find(c => c.name_en.toLowerCase().includes('organic'))?.id || '',
          key_health_benefits: ['প্রাকৃতিক অ্যান্টিবায়োটিক বৈশিষ্ট্য সংক্রমণের বিরুদ্ধে লড়াই করে', 'অ্যান্টিঅক্সিডেন্টে ভরপুর কোষের ক্ষতি প্রতিরোধ করে', 'গলা ব্যথা এবং কাশি উপশমানে সাহায্য করে', 'ক্ষত নিরাময় এবং ত্বকের স্বাস্থ্য উন্নত করে', 'পরিপাক স্বাস্থ্য উন্নত করে এবং ইমিউন সিস্টেম শক্তিশালী করে'],
          nutritional_info: 'প্রতি চামচ এর জন্য: ক্যালোরি 64, চিনি 17g, কার্বোহাইড্রেট 17g, ফ্ল্যাভোনয়েড, ফিনোলিক অ্যাসিড, অ্যান্টিঅক্সিডেন্ট এনজাইম। কোনো ফ্যাট, কোলেস্টেরল বা সোডিয়াম নেই।',
          dosage_and_usage: 'দৈনিক 1-2 চামচ খালি পেটে বা চা/গরম জলের সাথে উপভোগ করুন। টোস্ট, পেনকেক বা বেকড আইটেমে ছড়িয়ে খেতে পারেন। শীতল, শুষ্ক স্থানে সংরক্ষণ করুন কেটে ফেলা থেকে রক্ষা করার জন্য।',
          unit: '500g',
          unit_type: 'solid'
        }
      }

      // Fill form with AI-generated data including price, category, and images
      setFormData(prev => {
        const updatedData = {
          ...prev,
          description: prev.description || mockAiData.description,
          name_bn: prev.name_bn || mockAiData.name_bn,
          current_price: prev.current_price || mockAiData.current_price,
          category_id: prev.category_id || mockAiData.category_id,
          key_health_benefits: prev.key_health_benefits.length > 0 ? prev.key_health_benefits : mockAiData.key_health_benefits,
          nutritional_info: prev.nutritional_info || mockAiData.nutritional_info,
          dosage_and_usage: prev.dosage_and_usage || mockAiData.dosage_and_usage,
          unit: prev.unit || mockAiData.unit,
          unit_type: prev.unit_type || mockAiData.unit_type
        }

        // Add AI-generated product images if none exist
        if (prev.images.length === 0) {
          const aiImages = generateProductImages(productName, category)
          updatedData.images = aiImages
        }

        // Add AI-generated variants if none exist
        if (prev.variants.length === 0) {
          const aiVariants = generateProductVariants(mockAiData.unit_type, mockAiData.current_price)
          updatedData.variants = aiVariants
          updatedData.selected_units = getSelectedUnitsFromVariants(aiVariants)
        }

        return updatedData
      })

      toast.success('Product details filled with AI assistance!')
    } catch (error) {
      console.error('AI fill error:', error)
      toast.error('Failed to fill product details')
    } finally {
      setAiLoading(false)
    }
  }

  const parseBulkData = (data: string) => {
    const lines = data.trim().split('\n')
    const products = []
    
    for (const line of lines) {
      if (line.trim()) {
        // Parse CSV-like format: name,price,category,unit,description
        const parts = line.split(',').map(p => p.trim())
        if (parts.length >= 3) {
          products.push({
            name_en: parts[0],
            current_price: parts[1],
            category_name: parts[2],
            unit: parts[3] || '1pc',
            description: parts[4] || '',
            name_bn: parts[0],
            stock_quantity: '100',
            unit_type: 'quantity',
            status: 'none',
            key_health_benefits: [],
            nutritional_info: '',
            dosage_and_usage: '',
            is_featured: false,
            slug: generateSlug(parts[0]),
            images: []
          })
        }
      }
    }
    
    return products
  }

  const parseJsonData = (data: string) => {
    try {
      const jsonData = JSON.parse(data)
      const products = []
      
      // Handle both array format and object format
      const productArray = Array.isArray(jsonData) ? jsonData : [jsonData]
      
      for (const item of productArray) {
        if (item.name_en) {
          products.push({
            name_en: item.name_en,
            current_price: item.current_price || '0',
            category_name: item.category_name || 'General',
            unit: item.unit || '1pc',
            description: item.description || '',
            name_bn: item.name_bn || item.name_en,
            stock_quantity: item.stock_quantity || '100',
            unit_type: item.unit_type || 'quantity',
            status: item.status || 'none',
            key_health_benefits: item.key_health_benefits || [],
            nutritional_info: item.nutritional_info || '',
            dosage_and_usage: item.dosage_and_usage || '',
            is_featured: item.is_featured || false,
            slug: item.slug || generateSlug(item.name_en),
            images: []
          })
        }
      }
      
      return products
    } catch (error) {
      console.error('JSON parsing error:', error)
      toast.error('Invalid JSON format. Please check your data.')
      return []
    }
  }

  const checkBulkDuplicates = async (products: any[]) => {
    const duplicates = []
    
    for (const product of products) {
      const isDuplicate = await checkDuplicateName(product.name_en)
      if (isDuplicate) {
        duplicates.push(product.name_en)
      }
    }
    
    return duplicates
  }

  const handleBulkDataChange = (data: string) => {
    setBulkData(data)
    const parsed = parseBulkData(data)
    setBulkProducts(parsed)
  }

  const handleBulkJsonChange = (data: string) => {
    setBulkJsonData(data)
    const parsed = parseJsonData(data)
    setBulkProducts(parsed)
  }

  const handleBulkAiFill = async () => {
    if (!bulkInstruction.trim() && bulkProducts.length === 0) {
      toast.error('Please add bulk product data or AI instruction first')
      return
    }

    setAiLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let processedProducts = [...bulkProducts]

      // If instruction is provided, generate products based on instruction
      if (bulkInstruction.trim()) {
        const instructionProducts = generateProductsFromInstruction(bulkInstruction, selectedCategory)
        processedProducts = [...processedProducts, ...instructionProducts]
      }

      // Process each product with AI
      processedProducts = processedProducts.map((product) => {
        const productName = product.name_en.toLowerCase()
        
        let enhancedProduct = {
          ...product,
          description: product.description || `Experience the exceptional quality of our premium ${product.name_en}, carefully crafted to deliver outstanding health benefits and nutritional value. This product represents our commitment to excellence, combining traditional wisdom with modern scientific research to create something truly special for your wellness journey. Each ingredient is thoughtfully selected and processed to maintain maximum potency and bioavailability, ensuring your body receives the full spectrum of benefits nature intended. The rigorous quality control process guarantees purity, safety, and consistency in every batch, making it a reliable choice for health-conscious individuals. Incorporate this product into your daily routine to experience the transformative power of premium, carefully formulated nutrition.`,
          name_bn: product.name_en,
          key_health_benefits: product.key_health_benefits.length > 0 ? product.key_health_benefits : ['Rich in essential nutrients', 'Supports overall health and wellness', 'Made with natural ingredients', 'Free from harmful additives', 'Scientifically formulated for maximum benefits'],
          nutritional_info: product.nutritional_info || 'Contains premium natural ingredients with high bioavailability, essential vitamins and minerals, antioxidants, and beneficial compounds. Free from artificial preservatives, colors, and flavors. Non-GMO, gluten-free, and suitable for various dietary preferences.',
          dosage_and_usage: product.dosage_and_usage || 'For optimal results, incorporate this product into your daily wellness routine. Use consistently as part of a balanced diet and healthy lifestyle. Store in a cool, dry place away from direct sunlight to maintain freshness and potency.'
        }

        // Customize based on product type with detailed descriptions
        if (productName.includes('milk') || productName.includes('dairy')) {
          enhancedProduct = {
            ...enhancedProduct,
            description: `Indulge in the pure, creamy goodness of our fresh ${product.name_en}, sourced from carefully selected local farms that prioritize animal welfare and sustainable practices. This premium dairy product undergoes minimal processing to preserve its natural nutritional profile, delivering essential calcium, protein, and vitamins in their most bioavailable forms. Each glass provides a powerhouse of nutrients that support bone health, muscle development, and overall wellness, making it an excellent choice for growing children and adults alike. The gentle pasteurization process ensures safety while maintaining the fresh, natural taste that dairy lovers appreciate. Perfect for drinking, cooking, or adding to your favorite recipes, this versatile product brings both nutrition and deliciousness to your table.`,
            name_bn: 'দুধ',
            key_health_benefits: ['Excellent source of calcium for strong bones and teeth', 'High-quality protein for muscle growth and repair', 'Rich in vitamin D for enhanced calcium absorption', 'Contains essential B vitamins for energy metabolism', 'Supports immune system function and overall health'],
            nutritional_info: 'Per 250ml: Calcium 300mg, Protein 8g, Vitamin D 120IU, Vitamin B12 1.2mcg, Phosphorus 250mg, Potassium 380mg. Naturally contains lactose, no artificial additives or preservatives.',
            dosage_and_usage: 'Enjoy 1-2 glasses daily as part of a balanced diet. Perfect for breakfast with cereals, in smoothies, or as a refreshing drink. Store refrigerated and consume within 5 days of opening for best quality.'
          }
        } else if (productName.includes('fruit')) {
          enhancedProduct = {
            ...enhancedProduct,
            description: `Discover nature's sweetest gifts with our premium ${product.name_en}, hand-picked at peak ripeness to ensure maximum flavor and nutritional content. Each fruit is carefully selected from trusted growers who share our commitment to quality and sustainability, delivering a product that's as good for the planet as it is for you. Bursting with natural vitamins, minerals, and antioxidants, these fruits provide essential nutrients that support your body's defense systems and promote overall vitality. The natural sweetness makes them a perfect healthy snack for both children and adults, satisfying cravings while providing valuable nutrition. Enjoy them fresh, in smoothies, or as part of your favorite recipes to add natural flavor and health benefits to your meals.`,
            name_bn: 'ফল',
            key_health_benefits: ['Packed with vitamin C for immune support', 'High in dietary fiber for digestive health', 'Natural antioxidants protect against cellular damage', 'Low in calories, high in essential nutrients', 'Provides natural energy without added sugars'],
            nutritional_info: 'Rich in vitamin C, dietary fiber, natural sugars, antioxidants, flavonoids, and essential minerals. Naturally fat-free and cholesterol-free, making it an excellent choice for heart-healthy diets.',
            dosage_and_usage: 'Enjoy 1-2 servings daily as part of a balanced diet. Perfect as a fresh snack, in fruit salads, smoothies, or desserts. Wash thoroughly before consuming and store properly to maintain freshness.'
          }
        } else if (productName.includes('vitamin') || productName.includes('supplement')) {
          enhancedProduct = {
            ...enhancedProduct,
            description: `Elevate your wellness journey with our advanced ${product.name_en}, scientifically formulated using cutting-edge research and premium ingredients to deliver optimal results for your health goals. Each tablet contains a carefully balanced blend of essential nutrients, co-factors, and herbal extracts that work synergistically to support your body's natural functions and promote overall well-being. Our manufacturing process follows strict quality control standards, ensuring purity, potency, and consistency in every batch. The advanced delivery system enhances absorption and bioavailability, allowing your body to utilize the nutrients more effectively for maximum benefits. Trust this supplement to fill nutritional gaps in your diet and support your journey toward optimal health and vitality.`,
            name_bn: 'ভিটামিন',
            key_health_benefits: ['Boosts immune system function and resilience', 'Enhances energy levels and reduces fatigue', 'Supports cognitive function and mental clarity', 'Promotes healthy metabolism and nutrient absorption', 'Provides antioxidant protection against cellular damage'],
            nutritional_info: 'Contains premium vitamins A, C, D, E, K, B-complex, essential minerals like zinc, selenium, magnesium, plus herbal extracts and antioxidants. Free from artificial colors, flavors, and common allergens.',
            dosage_and_usage: 'Take 1 tablet daily with a meal, preferably in the morning. For best results, maintain consistent daily use and combine with a balanced diet and regular exercise. Store in a cool, dry place.'
          }
        }

        return enhancedProduct
      })

      setBulkProducts(processedProducts)
      toast.success('Bulk products enhanced with AI!')
    } catch (error) {
      console.error('Bulk AI fill error:', error)
      toast.error('Failed to enhance bulk products')
    } finally {
      setAiLoading(false)
    }
  }

  const generateProductsFromInstruction = (instruction: string, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    const categoryName = category?.name_en || 'General'
    
    // Generate sample products based on instruction and category
    const sampleProducts = []
    
    if (instruction.toLowerCase().includes('dairy') || categoryName.toLowerCase().includes('dairy')) {
      sampleProducts.push(
        {
          name_en: 'Fresh Cow Milk',
          current_price: '45',
          category_name: categoryName,
          unit: '1L',
          description: '',
          name_bn: 'গরুর দুধ',
          stock_quantity: '100',
          unit_type: 'liquid',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        },
        {
          name_en: 'Greek Yogurt',
          current_price: '80',
          category_name: categoryName,
          unit: '500g',
          description: '',
          name_bn: 'গ্রীক দই',
          stock_quantity: '50',
          unit_type: 'solid',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        }
      )
    } else if (instruction.toLowerCase().includes('fruit') || categoryName.toLowerCase().includes('fruit')) {
      sampleProducts.push(
        {
          name_en: 'Fresh Apples',
          current_price: '120',
          category_name: categoryName,
          unit: '1kg',
          description: '',
          name_bn: 'তাজা আপেল',
          stock_quantity: '200',
          unit_type: 'solid',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        },
        {
          name_en: 'Ripe Bananas',
          current_price: '60',
          category_name: categoryName,
          unit: '1dozen',
          description: '',
          name_bn: 'পাকা কলা',
          stock_quantity: '150',
          unit_type: 'quantity',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        }
      )
    } else if (instruction.toLowerCase().includes('supplement') || categoryName.toLowerCase().includes('supplement')) {
      sampleProducts.push(
        {
          name_en: 'Vitamin C Complex',
          current_price: '350',
          category_name: categoryName,
          unit: '60pcs',
          description: '',
          name_bn: 'ভিটামিন সি কমপ্লেক্স',
          stock_quantity: '100',
          unit_type: 'quantity',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        },
        {
          name_en: 'Multivitamin Tablets',
          current_price: '450',
          category_name: categoryName,
          unit: '30pcs',
          description: '',
          name_bn: 'মাল্টিভিটামিন ট্যাবলেট',
          stock_quantity: '80',
          unit_type: 'quantity',
          status: 'none',
          key_health_benefits: [],
          nutritional_info: '',
          dosage_and_usage: '',
          is_featured: false,
          images: []
        }
      )
    }

    return sampleProducts
  }

  const addSampleInstruction = () => {
    const sampleInstruction = "Create 5 premium dairy products including milk, yogurt, and cheese with detailed descriptions and health benefits. Focus on organic, farm-fresh quality."
    setBulkInstruction(sampleInstruction)
    
    // Auto-select dairy category if available
    const dairyCategory = categories.find(c => c.name_en.toLowerCase().includes('dairy'))
    if (dairyCategory) {
      setSelectedCategory(dairyCategory.id)
    }
  }

  const addSampleJsonData = () => {
    const sampleJson = `[
  {
    "name_en": "Fresh Cow Milk",
    "name_bn": "গরুর দুধ",
    "current_price": "45",
    "category_name": "Dairy",
    "unit": "1L",
    "description": "Farm-fresh organic milk from grass-fed cows",
    "stock_quantity": "100",
    "unit_type": "liquid",
    "status": "none",
    "key_health_benefits": ["Rich in calcium", "High protein", "Natural"],
    "nutritional_info": "Calcium, Protein, Vitamin D",
    "dosage_and_usage": "Drink 1-2 glasses daily",
    "is_featured": false,
    "slug": "fresh-cow-milk"
  },
  {
    "name_en": "Greek Yogurt",
    "name_bn": "গ্রীক দই",
    "current_price": "80",
    "category_name": "Dairy",
    "unit": "500g",
    "description": "Creamy and protein-rich yogurt with live cultures",
    "stock_quantity": "50",
    "unit_type": "solid",
    "status": "none",
    "key_health_benefits": ["High protein", "Probiotics", "Calcium"],
    "nutritional_info": "Protein, Probiotics, Calcium",
    "dosage_and_usage": "Eat 1 cup daily",
    "is_featured": false,
    "slug": "greek-yogurt"
  },
  {
    "name_en": "Fresh Apples",
    "name_bn": "তাজা আপেল",
    "current_price": "120",
    "category_name": "Fruits",
    "unit": "1kg",
    "description": "Crisp and sweet red apples",
    "stock_quantity": "200",
    "unit_type": "solid",
    "status": "none",
    "key_health_benefits": ["Vitamin C", "Fiber", "Antioxidants"],
    "nutritional_info": "Vitamin C, Fiber, Natural sugars",
    "dosage_and_usage": "Eat 1-2 apples daily",
    "is_featured": false,
    "slug": "fresh-apples"
  }
]`
    
    setBulkJsonData(sampleJson)
    const parsed = parseJsonData(sampleJson)
    setBulkProducts(parsed)
    setUploadFormat('json')
  }

  const addSampleCsvData = () => {
    const sampleData = `Fresh Cow Milk,45,Dairy,1L,Farm-fresh organic milk from grass-fed cows
Greek Yogurt,80,Dairy,500g,Creamy and protein-rich yogurt with live cultures
Cheddar Cheese,220,Dairy,250g,Aged cheddar with rich flavor
Fresh Apples,120,Fruits,1kg,Crisp and sweet red apples
Ripe Bananas,60,Fruits,1dozen,Naturally sweet and creamy bananas
Orange Juice,85,Beverages,1L,100% pure orange juice with pulp
Whole Wheat Bread,65,Bakery,500g,Freshly baked with whole grains`
    
    setBulkData(sampleData)
    const parsed = parseBulkData(sampleData)
    setBulkProducts(parsed)
    setUploadFormat('csv')
  }

  const handleBulkSubmit = async () => {
    if (bulkProducts.length === 0) {
      toast.error('Please add products to bulk upload')
      return
    }

    setLoading(true)
    try {
      // Check for duplicates first
      const duplicates = await checkBulkDuplicates(bulkProducts)
      if (duplicates.length > 0) {
        toast.error(`Found duplicate products: ${duplicates.join(', ')}. Please remove or rename these products.`)
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const product of bulkProducts) {
        try {
          // Find category ID
          const category = categories.find(c => c.name_en.toLowerCase() === product.category_name.toLowerCase())
          if (!category) {
            console.warn(`Category not found: ${product.category_name}`)
            errorCount++
            continue
          }

          // Generate slug if not provided
          const productSlug = product.slug || generateSlug(product.name_en)

          // Create product
          const { data: newProduct, error: productError } = await supabaseAdmin
            .from('products')
            .insert({
              name_en: product.name_en,
              name_bn: product.name_bn || null,
              description: product.description || null,
              current_price: parseFloat(product.current_price),
              old_price: null,
              discount_percentage: null,
              stock_quantity: parseInt(product.stock_quantity) || 100,
              unit: product.unit,
              unit_type: product.unit_type,
              category_id: category.id,
              status: product.status,
              key_health_benefits: product.key_health_benefits.length > 0 ? product.key_health_benefits : null,
              nutritional_info: product.nutritional_info || null,
              dosage_and_usage: product.dosage_and_usage || null,
              is_featured: product.is_featured,
              slug: productSlug
            })
            .select()
            .single()

          if (productError) throw productError

          successCount++
        } catch (error) {
          console.error(`Error adding product ${product.name_en}:`, error)
          errorCount++
        }
      }

      toast.success(`Bulk upload completed: ${successCount} successful, ${errorCount} failed`)
      
      // Reset bulk data
      setBulkData('')
      setBulkJsonData('')
      setBulkProducts([])
      
    } catch (error) {
      console.error('Bulk upload error:', error)
      toast.error('Failed to complete bulk upload')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name_en || !formData.category_id) {
        toast.error('Please fill all required fields')
        return
      }

      // Validate that at least one unit is selected
      const selectedUnitsCount = Object.values(formData.selected_units).filter(selected => selected).length
      if (selectedUnitsCount === 0) {
        toast.error('Please select at least one unit')
        return
      }

      // Validate variants
      if (formData.variants.length === 0) {
        toast.error('Please add at least one product variant')
        return
      }

      // Validate each variant
      for (const variant of formData.variants) {
        if (!variant.quantity_option) {
          toast.error('Please fill quantity option for all variants')
          return
        }
        
        if (variant.pricing_type === 'discount') {
          if (!variant.old_price) {
            toast.error('Please fill old price for discount variants')
            return
          }
          if (!variant.discount_percentage) {
            toast.error('Please enter discount percentage for discount variants')
            return
          }
        } else {
          // Fix pricing
          if (!variant.current_price) {
            toast.error('Please enter price for fix variants')
            return
          }
        }
      }

      // Ensure at least one default variant
      if (!formData.variants.some(v => v.is_default)) {
        toast.error('Please mark one variant as default')
        return
      }

      if (formData.images.length === 0) {
        toast.error('Please add at least one product image')
        return
      }

      // Check for duplicate product name
      const isDuplicate = await checkDuplicateName(formData.name_en)
      if (isDuplicate) {
        toast.error('A product with this name already exists. Please use a different name.')
        return
      }

      // Generate slug if not already generated
      const productSlug = formData.slug || generateSlug(formData.name_en)

      // Only use image URLs (no upload to storage)
      const uploadedImages = formData.images.map(image => ({
        image_url: image.url,
        is_primary: image.is_primary
      }))

      // Create product first (without pricing info as it will be in variants)
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .insert({
          name_en: formData.name_en,
          name_bn: formData.name_bn || null,
          description: formData.description || null,
          current_price: 0, // Will be updated from default variant
          old_price: null,
          discount_percentage: null,
          stock_quantity: 0, // Will be calculated from variants
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

      // Create product variants
      const variantsToInsert = formData.variants.map(variant => {
        let finalCurrentPrice = parseFloat(variant.current_price)
        let finalDiscountPercentage = variant.discount_percentage ? parseInt(variant.discount_percentage) : null
        let finalOldPrice = parseFloat(variant.old_price) || null

        if (variant.pricing_type === 'discount' && variant.old_price && variant.discount_percentage) {
          // Discount mode: calculate current price from old price and discount percentage
          const oldPrice = parseFloat(variant.old_price)
          const discountPercentage = parseFloat(variant.discount_percentage)
          finalCurrentPrice = oldPrice * (1 - discountPercentage / 100)
          finalDiscountPercentage = discountPercentage
          finalOldPrice = oldPrice
        } else if (variant.pricing_type === 'fix' && variant.current_price) {
          // Fix mode: use current price directly
          finalCurrentPrice = parseFloat(variant.current_price)
          finalDiscountPercentage = null
          finalOldPrice = null
        }

        return {
          product_id: product.id,
          quantity_option: variant.quantity_option,
          quantity_type: variant.quantity_type,
          current_price: finalCurrentPrice,
          old_price: finalOldPrice,
          discount_percentage: finalDiscountPercentage,
          stock_quantity: parseInt(variant.stock_quantity) || 0,
          is_default: variant.is_default,
          sort_order: variant.sort_order
        }
      })

      const { error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .insert(variantsToInsert)

      if (variantsError) throw variantsError

      // Update product with default variant pricing and total stock
      const defaultVariant = formData.variants.find(v => v.is_default)
      const totalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0)

      if (defaultVariant) {
        let defaultCurrentPrice = parseFloat(defaultVariant.current_price)
        let defaultDiscountPercentage = defaultVariant.discount_percentage ? parseInt(defaultVariant.discount_percentage) : null
        let defaultOldPrice = parseFloat(defaultVariant.old_price) || null

        if (defaultVariant.pricing_type === 'discount' && defaultVariant.old_price && defaultVariant.discount_percentage) {
          const oldPrice = parseFloat(defaultVariant.old_price)
          const discountPercentage = parseFloat(defaultVariant.discount_percentage)
          defaultCurrentPrice = oldPrice * (1 - discountPercentage / 100)
          defaultDiscountPercentage = discountPercentage
          defaultOldPrice = oldPrice
        } else if (defaultVariant.pricing_type === 'fix' && defaultVariant.current_price) {
          defaultCurrentPrice = parseFloat(defaultVariant.current_price)
          defaultDiscountPercentage = null
          defaultOldPrice = null
        }

        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({
            current_price: defaultCurrentPrice,
            old_price: defaultOldPrice,
            discount_percentage: defaultDiscountPercentage,
            stock_quantity: totalStock
          })
          .eq('id', product.id)

        if (updateError) throw updateError
      }

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

    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Add New Product</h2>
        
        {/* Upload Mode Toggle */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUploadMode('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'manual'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Manual Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('bulk')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'bulk'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>
      </div>

      {uploadMode === 'manual' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Fill and Clear Buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear Form
          </button>
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiLoading || !formData.name_en.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bot className="h-4 w-4" />
            {aiLoading ? 'AI Filling...' : 'AI Fill Details'}
          </button>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Name (English) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  const sampleNames = ['Fresh Cow Milk', 'Organic Honey', 'Vitamin C Tablets', 'Whole Wheat Bread', 'Green Tea']
                  const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
                  setFormData(prev => ({
                    ...prev,
                    name_en: randomName,
                    slug: generateSlug(randomName)
                  }))
                }}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                title="Autofill"
              >
                <Bot className="h-4 w-4" />
              </button>
            </div>
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
            rows={6}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Unit Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Available Units *
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unit_gm"
                  checked={formData.selected_units.gm}
                  onChange={() => handleUnitCheckboxChange('gm')}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="unit_gm" className="text-sm text-gray-300">
                  gm (grams)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unit_ml"
                  checked={formData.selected_units.ml}
                  onChange={() => handleUnitCheckboxChange('ml')}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="unit_ml" className="text-sm text-gray-300">
                  ml (milliliters)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unit_L"
                  checked={formData.selected_units.L}
                  onChange={() => handleUnitCheckboxChange('L')}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="unit_L" className="text-sm text-gray-300">
                  L (liters)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unit_kg"
                  checked={formData.selected_units.kg}
                  onChange={() => handleUnitCheckboxChange('kg')}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="unit_kg" className="text-sm text-gray-300">
                  kg (kilograms)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unit_pc"
                  checked={formData.selected_units.pc}
                  onChange={() => handleUnitCheckboxChange('pc')}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="unit_pc" className="text-sm text-gray-300">
                  pc (pieces)
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select all units that this product is available in
            </p>
          </div>
        </div>

        {/* Product Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Product Variants & Pricing</h3>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </button>
          </div>

          {formData.variants.length === 0 ? (
            <div className="text-center py-8 bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-600">
              <p className="text-gray-400 mb-2">No variants added yet</p>
              <p className="text-sm text-gray-500">Add variants to offer different quantity options with pricing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h4 className="text-white font-medium">
                        Variant {index + 1}: {variant.quantity_option}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Pricing:</span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <input
                              type="radio"
                              id={`fix_${variant.id}`}
                              name={`pricing_type_${variant.id}`}
                              value="fix"
                              checked={variant.pricing_type === 'fix'}
                              onChange={() => updateVariant(variant.id, 'pricing_type', 'fix')}
                              className="w-3 h-3 text-primary bg-gray-600 border-gray-500 focus:ring-primary focus:ring-2"
                            />
                            <label htmlFor={`fix_${variant.id}`} className="text-xs text-gray-300">
                              Fix
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <input
                              type="radio"
                              id={`discount_${variant.id}`}
                              name={`pricing_type_${variant.id}`}
                              value="discount"
                              checked={variant.pricing_type === 'discount'}
                              onChange={() => updateVariant(variant.id, 'pricing_type', 'discount')}
                              className="w-3 h-3 text-primary bg-gray-600 border-gray-500 focus:ring-primary focus:ring-2"
                            />
                            <label htmlFor={`discount_${variant.id}`} className="text-xs text-gray-300">
                              Discount
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDefaultVariant(variant.id)}
                        className={`px-3 py-1 rounded text-sm ${
                          variant.is_default
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        } transition-colors`}
                      >
                        {variant.is_default ? 'Default' : 'Set Default'}
                      </button>
                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                  {/* First Row: Basic Info + Price (if Fix) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Quantity Option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantity Option *
                      </label>
                      <input
                        type="text"
                        value={variant.quantity_option}
                        onChange={(e) => updateVariant(variant.id, 'quantity_option', e.target.value)}
                        placeholder={getQuantityPlaceholder()}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Quantity Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantity Type
                      </label>
                      <select
                        value={variant.quantity_type}
                        onChange={(e) => updateVariant(variant.id, 'quantity_type', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="weight">Weight</option>
                        <option value="volume">Volume</option>
                        <option value="pieces">Pieces</option>
                      </select>
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={variant.stock_quantity}
                        onChange={(e) => updateVariant(variant.id, 'stock_quantity', e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Price Field (only shown for Fix pricing) */}
                    {variant.pricing_type === 'fix' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Price *
                        </label>
                        <input
                          type="number"
                          value={variant.current_price}
                          onChange={(e) => updateVariant(variant.id, 'current_price', e.target.value)}
                          step="0.01"
                          min="0"
                          placeholder="Enter price"
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Second Row: Discount Fields (only shown for Discount pricing) */}
                  {variant.pricing_type === 'discount' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Old Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Old Price *
                        </label>
                        <input
                          type="number"
                          value={variant.old_price}
                          onChange={(e) => updateVariant(variant.id, 'old_price', e.target.value)}
                          step="0.01"
                          min="0"
                          placeholder="Enter original price"
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      {/* Discount Percentage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Discount % *
                        </label>
                        <input
                          type="number"
                          value={variant.discount_percentage}
                          onChange={(e) => updateVariant(variant.id, 'discount_percentage', e.target.value)}
                          min="0"
                          max="100"
                          placeholder="Enter discount %"
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      {/* Calculated Current Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Discounted Price
                        </label>
                        <input
                          type="number"
                          value={variant.current_price}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-gray-300 placeholder-gray-400 cursor-not-allowed"
                          placeholder="Calculated"
                        />
                      </div>
                    </div>
                  )}

                  {/* Third Row: Product Image URL */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Product Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter image URL for this variant (optional)"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}
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
            rows={4}
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
            rows={3}
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
      ) : (
        // Bulk Upload Section
        <div className="space-y-6">
          {/* AI Instruction Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">AI Product Generation</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addSampleInstruction}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                >
                  Sample Instruction
                </button>
                <button
                  type="button"
                  onClick={addSampleCsvData}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                >
                  Sample CSV
                </button>
                <button
                  type="button"
                  onClick={addSampleJsonData}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                >
                  Sample JSON
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category for AI Generation
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_en} {category.name_bn && `(${category.name_bn})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Instructions
                </label>
                <textarea
                  value={bulkInstruction}
                  onChange={(e) => setBulkInstruction(e.target.value)}
                  rows={4}
                  placeholder="Describe what products you want AI to generate... Example: Create 5 premium dairy products including milk, yogurt, and cheese with detailed descriptions and health benefits. Focus on organic, farm-fresh quality."
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* AI Fill Button for Bulk */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleBulkAiFill}
              disabled={aiLoading || (!bulkProducts.length && !bulkInstruction.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bot className="h-4 w-4" />
              {aiLoading ? 'AI Processing...' : 'AI Generate Products'}
            </button>
          </div>

          {/* Bulk Data Input */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Bulk Product Data
              </label>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setUploadFormat('csv')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    uploadFormat === 'csv'
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  CSV Format
                </button>
                <button
                  type="button"
                  onClick={() => setUploadFormat('json')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    uploadFormat === 'json'
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  JSON Format
                </button>
              </div>
            </div>

            {uploadFormat === 'csv' ? (
              <div>
                <div className="mb-2">
                  <p className="text-sm text-gray-500">
                    Enter product data in CSV format: name,price,category,unit,description
                  </p>
                  <p className="text-sm text-gray-500">
                    Example: Apple,50,Fruits,1kg,Fresh red apples from local farms
                  </p>
                </div>
                <textarea
                  value={bulkData}
                  onChange={(e) => handleBulkDataChange(e.target.value)}
                  rows={8}
                  placeholder="Product Name,Price,Category,Unit,Description&#10;Apple,50,Fruits,1kg,Fresh red apples&#10;Banana,30,Fruits,1dozen,Ripe bananas&#10;Milk,45,Dairy,1L,Fresh cow milk"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  <p className="text-sm text-gray-500">
                    Enter product data in JSON format. Each product should include name_en, current_price, category_name, unit, etc.
                  </p>
                  <p className="text-sm text-gray-500">
                    Use the "Sample JSON" button to see the format
                  </p>
                </div>
                <textarea
                  value={bulkJsonData}
                  onChange={(e) => handleBulkJsonChange(e.target.value)}
                  rows={8}
                  placeholder='[{"name_en": "Product Name", "current_price": "50", "category_name": "Category", "unit": "1kg", "description": "Product description"}]'
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Bulk Products Preview */}
          {bulkProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Products to Upload ({bulkProducts.length})
              </h3>
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-600 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Unit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {bulkProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-600">
                          <td className="px-4 py-2 text-sm text-white">{product.name_en}</td>
                          <td className="px-4 py-2 text-sm text-white">${product.current_price}</td>
                          <td className="px-4 py-2 text-sm text-white">{product.category_name}</td>
                          <td className="px-4 py-2 text-sm text-white">{product.unit}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">{product.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Upload Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={loading || bulkProducts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {loading ? 'Uploading...' : `Upload ${bulkProducts.length} Products`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
