'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface CheckoutFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  billing_address: string
  payment_method: string
  notes: string
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    billing_address: '',
    payment_method: 'cash_on_delivery',
    notes: ''
  })

  if (cart.items.length === 0) {
    router.push('/cart')
    return null
  }

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => total + (item.current_price * item.quantity), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.05 // 5% tax
  }

  const calculateShipping = () => {
    return cart.totalPrice > 1000 ? 0 : 50 // Free shipping over 1000
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.customer_name.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!formData.customer_email.trim()) {
        toast.error('Please enter your email')
        return
      }
      if (!formData.customer_phone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
      if (!formData.shipping_address.trim()) {
        toast.error('Please enter your shipping address')
        return
      }
      if (!sameAsShipping && !formData.billing_address.trim()) {
        toast.error('Please enter your billing address')
        return
      }

      // Create order
      const orderData = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        shipping_address: formData.shipping_address.trim(),
        billing_address: sameAsShipping ? formData.shipping_address.trim() : formData.billing_address.trim(),
        payment_method: formData.payment_method,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        shipping_cost: calculateShipping(),
        discount_amount: 0,
        total_amount: calculateTotal(),
        notes: formData.notes.trim() || null
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        toast.error('Failed to create order')
        return
      }

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.current_price,
        total_price: item.current_price * item.quantity,
        product_name: item.name_en,
        product_image_url: item.image_url || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        toast.error('Failed to create order items')
        return
      }

      // Clear cart and redirect to order confirmation
      clearCart()
      router.push(`/order-confirmation/${order.id}`)
      toast.success('Order placed successfully!')

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to place order')
    } finally {
      setLoading(false)
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
              {/* Checkout Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="text-gray-600 mt-1">Complete your order details</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Billing Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="customer_name"
                          value={formData.customer_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="customer_email"
                          value={formData.customer_email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="customer_phone"
                          value={formData.customer_phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+880 1XXX XXXXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method *
                        </label>
                        <select
                          name="payment_method"
                          value={formData.payment_method}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="cash_on_delivery">Cash on Delivery</option>
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                          <option value="rocket">Rocket</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shipping Address *
                        </label>
                        <textarea
                          name="shipping_address"
                          value={formData.shipping_address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="House #123, Road #4, Dhanmondi, Dhaka-1205"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sameAsShipping"
                          checked={sameAsShipping}
                          onChange={(e) => setSameAsShipping(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="sameAsShipping" className="text-sm text-gray-700">
                          Billing address same as shipping address
                        </label>
                      </div>

                      {!sameAsShipping && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Billing Address *
                          </label>
                          <textarea
                            name="billing_address"
                            value={formData.billing_address}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="House #123, Road #4, Dhanmondi, Dhaka-1205"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order Notes (Optional)
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Special instructions for delivery..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  <div className="space-y-2 mb-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name_en} x {item.quantity}
                          {item.selectedQuantity && ` (${item.selectedQuantity})`}
                        </span>
                        <span className="font-medium">৳{(item.current_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">৳{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (5%)</span>
                      <span className="font-medium">৳{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {calculateShipping() === 0 ? 'FREE' : `৳${calculateShipping().toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>৳{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => router.push('/cart')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
