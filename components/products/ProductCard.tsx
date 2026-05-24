'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useCart } from '@/contexts/CartContext'

interface ProductImage {
  id: string
  image_url: string
  is_primary: boolean
}

interface ProductVariant {
  id: string
  quantity_option: string
  quantity_type: 'weight' | 'volume' | 'pieces'
  current_price: number
  old_price?: number
  discount_percentage?: number
  stock_quantity: number
  is_default: boolean
}

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
  slug: string
  product_images: ProductImage[]
  variants?: ProductVariant[]
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loading, setLoading] = useState(false)

  const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0]

  // Set default variant on mount
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0]
      setSelectedVariant(defaultVariant)
    }
  }, [product.variants])

  // Get current pricing based on selected variant
  const getCurrentPricing = () => {
    if (selectedVariant) {
      return {
        current_price: selectedVariant.current_price,
        old_price: selectedVariant.old_price,
        discount_percentage: selectedVariant.discount_percentage
      }
    }
    return {
      current_price: product.current_price,
      old_price: product.old_price,
      discount_percentage: product.discount_percentage
    }
  }

  const currentPricing = getCurrentPricing()

  const getQuantityOptions = () => {
    if (product.variants && product.variants.length > 0) {
      return product.variants
    }
    // Fallback to hardcoded options if no variants
    if (product.unit_type === 'solid') {
      return [
        { id: '1', quantity_option: '250g', quantity_type: 'weight' as const, current_price: product.current_price * 0.5, stock_quantity: 100, is_default: true },
        { id: '2', quantity_option: '500g', quantity_type: 'weight' as const, current_price: product.current_price, stock_quantity: 100, is_default: false },
        { id: '3', quantity_option: '1kg', quantity_type: 'weight' as const, current_price: product.current_price * 1.8, stock_quantity: 100, is_default: false }
      ]
    } else if (product.unit_type === 'liquid') {
      return [
        { id: '1', quantity_option: '250ml', quantity_type: 'volume' as const, current_price: product.current_price * 0.3, stock_quantity: 100, is_default: true },
        { id: '2', quantity_option: '500ml', quantity_type: 'volume' as const, current_price: product.current_price * 0.6, stock_quantity: 100, is_default: false },
        { id: '3', quantity_option: '1L', quantity_type: 'volume' as const, current_price: product.current_price, stock_quantity: 100, is_default: false }
      ]
    } else {
      return [
        { id: '1', quantity_option: '1pc', quantity_type: 'pieces' as const, current_price: product.current_price, stock_quantity: 100, is_default: true },
        { id: '2', quantity_option: '3pcs', quantity_type: 'pieces' as const, current_price: product.current_price * 2.5, stock_quantity: 100, is_default: false },
        { id: '3', quantity_option: '5pcs', quantity_type: 'pieces' as const, current_price: product.current_price * 4, stock_quantity: 100, is_default: false }
      ]
    }
  }

  const getStatusBadge = () => {
    if (product.status === 'none') return null
    
    const statusConfig = {
      new_arrival: { label: 'New Arrival', className: 'bg-blue-100 text-blue-800' },
      best_selling: { label: 'BEST SELLER', className: 'bg-green-100 text-green-800' },
      featured: { label: 'Featured', className: 'bg-purple-100 text-purple-800' }
    }

    const config = statusConfig[product.status]
    return (
      <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getDiscountBadge = () => {
    const discount = currentPricing.discount_percentage
    if (!discount) return null
    
    return (
      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
        -{discount}%
      </span>
    )
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use selected variant or default to first option
    const variantToAdd = selectedVariant || getQuantityOptions()[0]
    
    setLoading(true)
    try {
      const cartItem = {
        id: `${product.id}-${variantToAdd.id}`,
        name_en: product.name_en,
        name_bn: product.name_bn,
        image_url: primaryImage?.image_url,
        current_price: variantToAdd.current_price,
        old_price: variantToAdd.old_price,
        unit: product.unit,
        quantity: 1,
        selectedQuantity: variantToAdd.quantity_option
      }
      
      addToCart(cartItem)
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use selected variant or default to first option
    const variantToAdd = selectedVariant || getQuantityOptions()[0]

    // Add to cart and redirect to checkout
    const cartItem = {
      id: `${product.id}-${variantToAdd.id}`,
      name_en: product.name_en,
      name_bn: product.name_bn,
      image_url: primaryImage?.image_url,
      current_price: variantToAdd.current_price,
      old_price: variantToAdd.old_price,
      unit: product.unit,
      quantity: 1,
      selectedQuantity: variantToAdd.quantity_option
    }
    
    addToCart(cartItem)
    window.location.href = '/checkout'
  }

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer max-w-64">
      <div className="relative">
        {/* Product Image */}
        <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={product.name_en}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Status and Discount Badges */}
        {getStatusBadge()}
        {getDiscountBadge()}

        {/* Wishlist Button */}
        <button
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50"
          onClick={() => toast.success('Added to wishlist!')}
        >
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>

      <div className="p-3">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm">
          {product.name_en}
        </h3>
        {product.name_bn && (
          <p className="text-xs text-gray-600 font-bengali line-clamp-1">
            {product.name_bn}
          </p>
        )}

        {/* Price */}
        <div className="mt-1">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-gray-900">
              ৳{currentPricing.current_price}
            </span>
            {currentPricing.old_price && (
              <span className="text-xs text-gray-500 line-through">
                ৳{currentPricing.old_price}
              </span>
            )}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mt-2">
          <div className="flex space-x-1">
            {getQuantityOptions().map(variant => (
              <button
                key={variant.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedVariant(variant)
                }}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded border transition-colors ${
                  selectedVariant?.id === variant.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-600'
                }`}
              >
                {variant.quantity_option}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="flex items-center justify-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {loading ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
          >
            Buy
          </button>
        </div>

        {/* Stock Status */}
        <div className="mt-1">
          {product.stock_quantity <= 5 && product.stock_quantity > 0 ? (
            <span className="text-xs text-orange-600">Only {product.stock_quantity} items left</span>
          ) : product.stock_quantity === 0 ? (
            <span className="text-xs text-red-600">Out of Stock</span>
          ) : null}
        </div>
      </div>
      </div>
    </Link>
  )
}
