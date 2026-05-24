'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ShoppingCart, Heart, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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
  category_id: string
  status: string
  key_health_benefits?: string[]
  nutritional_info?: string
  dosage_and_usage?: string
  is_featured: boolean
  slug: string
  product_images: ProductImage[]
  variants: ProductVariant[]
  category?: {
    id: string
    name_en: string
    name_bn?: string
    slug: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const { addToCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loadingAddToCart, setLoadingAddToCart] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  const fetchProduct = async () => {
    try {
      // Try to get product by slug first
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name_en, name_bn, slug),
          product_images(image_url, is_primary),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .single()

      if (productError) {
        console.error('Product fetch error:', productError)
        toast.error('Product not found')
        return
      }

      setProduct(productData)
      
      // Set default variant
      const defaultVariant = productData.variants?.find((v: ProductVariant) => v.is_default) || productData.variants?.[0]
      setSelectedVariant(defaultVariant)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return

    setLoadingAddToCart(true)
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: quantity,
        price: selectedVariant.current_price
      })
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setLoadingAddToCart(false)
    }
  }

  const basePrice = selectedVariant?.current_price || product?.current_price || 0
  const currentPrice = basePrice * quantity
  const oldPrice = selectedVariant?.old_price || product?.old_price
  const discountPercentage = selectedVariant?.discount_percentage || product?.discount_percentage
  const stockQuantity = selectedVariant?.stock_quantity || product?.stock_quantity || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Products</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage.image_url}
                  alt={product.name_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 text-4xl sm:text-6xl">📦</div>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.product_images.map((image) => (
                  <div
                    key={image.id}
                    className={`aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2 ${
                      image.id === primaryImage?.id ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={product.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{product.name_en}</h1>
              {product.name_bn && (
                <p className="text-lg sm:text-xl text-gray-600 font-bengali mt-1">{product.name_bn}</p>
              )}
              {product.category && (
                <Link 
                  href={`/categories/${product.category.slug}`}
                  className="text-sm sm:text-base text-primary hover:underline inline-block mt-2"
                >
                  {product.category.name_en}
                </Link>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-2 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">৳{currentPrice}</span>
                {quantity > 1 && (
                  <span className="text-sm sm:text-base text-gray-500">
                    (৳{basePrice} × {quantity})
                  </span>
                )}
                {oldPrice && oldPrice > currentPrice && (
                  <>
                    <span className="text-base sm:text-lg text-gray-500 line-through">৳{oldPrice * quantity}</span>
                    {discountPercentage && (
                      <span className="text-sm sm:text-base bg-red-100 text-red-800 px-2 py-1 rounded inline-block">
                        -{discountPercentage}%
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {stockQuantity > 0 ? `${stockQuantity} in stock` : 'Out of stock'}
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Select Quantity</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 sm:px-6 sm:py-3 border rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{variant.quantity_option}</div>
                      <div className="text-sm sm:text-base font-bold">৳{variant.current_price}</div>
                      {variant.stock_quantity <= 0 && (
                        <div className="text-xs text-red-500">Out of stock</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={stockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 sm:w-20 text-center border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base"
                />
                <button
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  className="p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={loadingAddToCart || stockQuantity === 0}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 sm:py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-semibold"
            >
              {loadingAddToCart ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Mobile-optimized Sections */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Health Benefits */}
              {product.key_health_benefits && product.key_health_benefits.length > 0 && (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Key Health Benefits</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {product.key_health_benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                        <span className="text-green-500 mt-0.5 sm:mt-1 flex-shrink-0">✓</span>
                        <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nutritional Info */}
              {product.nutritional_info && (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Nutritional Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap leading-relaxed">{product.nutritional_info}</p>
                  </div>
                </div>
              )}

              {/* Dosage and Usage */}
              {product.dosage_and_usage && (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Dosage and Usage</h3>
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap leading-relaxed">{product.dosage_and_usage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
