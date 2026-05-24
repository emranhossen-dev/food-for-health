'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  const handleRemoveItem = async (id: string) => {
    setIsRemoving(id)
    removeFromCart(id)
    setIsRemoving(null)
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateQuantity(id, quantity)
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

  if (cart.items.length === 0) {
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
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
              {/* Cart Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                  <span className="text-sm text-gray-600">
                    {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Cart Items */}
              <div className="px-6 py-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name_en}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{item.name_en}</h3>
                      {item.name_bn && (
                        <p className="text-sm text-gray-600 font-bengali">{item.name_bn}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-gray-900">
                          ৳{item.current_price}
                        </span>
                        {item.old_price && (
                          <span className="text-sm text-gray-500 line-through">
                            ৳{item.old_price}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">/{item.unit}</span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ৳{(item.current_price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isRemoving === item.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="space-y-2">
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
                  {cart.totalPrice > 1000 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Free shipping applied!</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>৳{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={clearCart}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    href="/checkout"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center"
                  >
                    Proceed to Checkout
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
