'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  Star, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ShoppingCart,
  PlayCircle,
  CheckCircle,
  Leaf,
  Verified,
  ChevronLeft,
  ChevronRight as ArrowForward,
  Heart,
  MessageCircle,
  ArrowUp
} from 'lucide-react'
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

interface RelatedProduct {
  id: string
  name_en: string
  current_price: number
  unit: string
  product_images: Array<{
    image_url: string
    is_primary: boolean
  }>
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    fetchProduct()
    fetchRelatedProducts()

    // Scroll to top functionality
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
      
      // Set primary image as selected
      const primaryIndex = data.product_images.findIndex((img: any) => img.is_primary)
      setSelectedImage(primaryIndex >= 0 ? primaryIndex : 0)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name_en,
          current_price,
          unit,
          product_images (image_url, is_primary)
        `)
        .neq('id', productId)
        .limit(5)

      if (error) throw error
      setRelatedProducts(data || [])
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const handleAddToCart = () => {
    // Add to cart logic here
    toast.success('Product added to cart!')
  }

  const handleBuyNow = () => {
    // Buy now logic here
    toast.success('Proceeding to checkout...')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 0)) {
      setQuantity(newQuantity)
    }
  }

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button 
            onClick={() => router.push('/')}
            className="text-primary hover:text-primary/80"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const images = product.product_images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-primary">Food for Health</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <a href="/" className="hover:text-primary">Home</a>
          <ChevronRight className="h-4 w-4" />
          <a href="#" className="hover:text-primary">Products</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{product.name_en}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
              {images[selectedImage] && (
                <img
                  src={images[selectedImage].image_url}
                  alt={product.name_en}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-4">
              {images.slice(0, 4).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg border-2 p-2 bg-white ${
                    selectedImage === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={`${product.name_en} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {images.length < 4 && (
                <button className="aspect-square rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                  <PlayCircle className="h-8 w-8 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name_en}</h1>
              <p className="text-lg text-gray-600 mb-4">
                {product.name_bn && `${product.name_bn} • `}
                {product.unit}
              </p>
              
              {/* Rating */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(No reviews yet)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-3xl font-bold text-primary">৳{product.current_price}</span>
                {product.old_price && (
                  <span className="text-lg text-gray-500 line-through">৳{product.old_price}</span>
                )}
                {product.discount_percentage && (
                  <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                    {product.discount_percentage}% OFF
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <span className="text-green-600 font-medium">In Stock ({product.stock_quantity} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Quantity and Actions */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(quantity - 1)}
                    className="p-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
                
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors"
                  disabled={product.stock_quantity === 0}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Key Health Benefits */}
            {product.key_health_benefits && product.key_health_benefits.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Key Health Benefits</span>
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.key_health_benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex space-x-8 border-b border-gray-200 mb-8">
            {['description', 'nutritional', 'usage', 'shipping'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 border-b-2 font-medium capitalize ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'description' && 'Description'}
                {tab === 'nutritional' && 'Nutritional Info'}
                {tab === 'usage' && 'Usage & Dosage'}
                {tab === 'shipping' && 'Shipping & Delivery'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>
              )}
              
              {activeTab === 'nutritional' && (
                <div>
                  <p className="text-gray-700">
                    {product.nutritional_info ? 
                      JSON.stringify(product.nutritional_info, null, 2) : 
                      'Nutritional information not available.'
                    }
                  </p>
                </div>
              )}
              
              {activeTab === 'usage' && (
                <div>
                  <p className="text-gray-700">
                    {product.dosage_and_usage || 'Usage and dosage information not available.'}
                  </p>
                </div>
              )}
              
              {activeTab === 'shipping' && (
                <div>
                  <p className="text-gray-700">
                    Free shipping on orders over ৳500. Standard delivery takes 3-5 business days.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Why Choose Our Products?</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">100% Organic</h5>
                    <p className="text-sm text-gray-600">Pure soil to shelf transparency</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Verified className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Lab Tested</h5>
                    <p className="text-sm text-gray-600">Quality and safety guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
                <p className="text-gray-600">Enhance your wellness with these companion items</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                  <ArrowForward className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedImage = relatedProduct.product_images.find(img => img.is_primary) || relatedProduct.product_images[0]
                return (
                  <div key={relatedProduct.id} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square p-4 relative">
                      {relatedImage && (
                        <img
                          src={relatedImage.image_url}
                          alt={relatedProduct.name_en}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <button className="absolute bottom-2 right-2 bg-primary text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors text-sm mb-2">
                        {relatedProduct.name_en}
                      </h3>
                      <p className="text-primary font-bold">৳{relatedProduct.current_price}</p>
                      <p className="text-xs text-gray-500">{relatedProduct.unit}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <button className="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
          <MessageCircle className="h-6 w-6" />
        </button>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-all"
          >
            <ArrowUp className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}
