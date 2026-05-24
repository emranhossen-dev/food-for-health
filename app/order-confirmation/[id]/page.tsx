'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Package, Truck, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  order_status: string
  payment_status: string
  payment_method: string
  total_amount: number
  created_at: string
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  product_image_url?: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('Order fetch error:', orderError)
        router.push('/')
        return
      }

      setOrder(orderData)

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Order items fetch error:', itemsError)
        return
      }

      setOrderItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching order details:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-purple-100 text-purple-800'
      case 'shipped':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery'
      case 'bkash':
        return 'bKash'
      case 'nagad':
        return 'Nagad'
      case 'rocket':
        return 'Rocket'
      default:
        return method
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Categories */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategorySidebar />
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Success Header */}
              <div className="px-6 py-8 text-center border-b border-gray-200">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                <p className="text-gray-600">Thank you for your order. We'll send you an email with your order details.</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Order Details */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium">{order.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                        <span>Total Amount:</span>
                        <span>৳{order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{order.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{order.customer_email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{order.customer_phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Shipping Address:</span>
                        <p className="font-medium">{order.shipping_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{item.product_name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>•</span>
                            <span>৳{item.unit_price.toFixed(2)} each</span>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ৳{item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Order Processing</p>
                        <p className="text-sm text-blue-700">We'll process your order within 1-2 business days.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Payment Confirmation</p>
                        <p className="text-sm text-blue-700">You'll receive payment confirmation via email.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Delivery</p>
                        <p className="text-sm text-blue-700">Your order will be delivered to your shipping address.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Link
                    href="/"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    href={`/track-order/${order.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Track Order
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
