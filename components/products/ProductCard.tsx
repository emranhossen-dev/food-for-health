'use client'

import { useState } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ProductImage {
  id: string
  image_url: string
  is_primary: boolean
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
  product_images: ProductImage[]
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedQuantity, setSelectedQuantity] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0]

  const getQuantityOptions = () => {
    if (product.unit_type === 'solid') {
      return ['250g', '500g', '1000g']
    } else if (product.unit_type === 'liquid') {
      return ['250ml', '500ml', '1L']
    } else {
      return ['1pc', '3pcs', '5pcs']
    }
  }

  const getStatusBadge = () => {
    if (product.status === 'none') return null
    
    const statusConfig = {
      new_arrival: { label: 'New Arrival', className: 'bg-blue-100 text-blue-800' },
      best_selling: { label: 'Best Selling', className: 'bg-orange-100 text-orange-800' },
      featured: { label: 'Featured', className: 'bg-purple-100 text-purple-800' }
    }

    const config = statusConfig[product.status]
    return (
      <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getDiscountBadge = () => {
    if (!product.discount_percentage) return null
    
    return (
      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        {product.discount_percentage}% OFF
      </span>
    )
  }

  const handleAddToCart = async () => {
    if (!selectedQuantity) {
      toast.error('Please select a quantity')
      return
    }

    setLoading(true)
    try {
      // TODO: Implement cart functionality with Supabase
      toast.success('Added to cart successfully!')
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!selectedQuantity) {
      toast.error('Please select a quantity')
      return
    }

    // TODO: Implement buy now functionality
    toast.success('Redirecting to checkout...')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={product.name_en}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

      <div className="p-4">
        {/* Product Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 hover:text-primary transition-colors line-clamp-2">
            {product.name_en}
          </h3>
          {product.name_bn && (
            <p className="text-sm text-gray-600 font-bengali line-clamp-1">
              {product.name_bn}
            </p>
          )}
        </Link>

        {/* Price */}
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">
              ৳{product.current_price}
            </span>
            {product.old_price && (
              <span className="text-sm text-gray-500 line-through">
                ৳{product.old_price}
              </span>
            )}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mt-3">
          <select
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Select {product.unit_type === 'solid' ? 'Weight' : product.unit_type === 'liquid' ? 'Volume' : 'Quantity'}</option>
            {getQuantityOptions().map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="flex items-center justify-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Buy Now
          </button>
        </div>

        {/* Stock Status */}
        <div className="mt-2">
          {product.stock_quantity > 0 ? (
            <span className="text-xs text-green-600">In Stock ({product.stock_quantity} available)</span>
          ) : (
            <span className="text-xs text-red-600">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  )
}
