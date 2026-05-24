'use client'

import { useState, useEffect } from 'react'

interface ProductPricingProps {
  current_price: string
  old_price: string
  discount_percentage: string
  has_discount: boolean
  onPricingChange: (field: string, value: string | boolean) => void
}

export default function ProductPricing({
  current_price,
  old_price,
  discount_percentage,
  has_discount,
  onPricingChange
}: ProductPricingProps) {
  // Auto-calculate discount percentage when prices change
  useEffect(() => {
    if (current_price && old_price && parseFloat(current_price) > 0 && parseFloat(old_price) > 0) {
      const discount = ((parseFloat(old_price) - parseFloat(current_price)) / parseFloat(old_price)) * 100
      onPricingChange('discount_percentage', discount.toFixed(2))
      onPricingChange('has_discount', parseFloat(current_price) < parseFloat(old_price))
    }
  }, [current_price, old_price, onPricingChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      onPricingChange(name, checkbox.checked)
    } else {
      onPricingChange(name, value)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">Pricing Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">৳</span>
            <input
              type="number"
              name="current_price"
              value={current_price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Old Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">৳</span>
            <input
              type="number"
              name="old_price"
              value={old_price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Discount Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              name="discount_percentage"
              value={discount_percentage}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="100"
              className="w-full pr-8 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              readOnly
            />
            <span className="absolute right-3 top-2 text-gray-400">%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="has_discount"
          checked={has_discount}
          onChange={handleInputChange}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="has_discount" className="text-sm font-medium text-gray-300">
          This product has a discount
        </label>
      </div>

      {/* Pricing Preview */}
      {current_price && (
        <div className="bg-gray-700 rounded-lg p-4 mt-4">
          <h3 className="text-white font-medium mb-2">Pricing Preview</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Price:</span>
              <span className="text-white font-medium">৳{parseFloat(current_price).toFixed(2)}</span>
            </div>
            {old_price && parseFloat(old_price) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Old Price:</span>
                <span className="text-gray-300 line-through">৳{parseFloat(old_price).toFixed(2)}</span>
              </div>
            )}
            {has_discount && discount_percentage && (
              <div className="flex justify-between">
                <span className="text-gray-400">Discount:</span>
                <span className="text-green-400 font-medium">{parseFloat(discount_percentage).toFixed(2)}% OFF</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Tips */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">💡 Pricing Tips</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Set the current price - this is the selling price</li>
          <li>• Set the old price if there's a discount</li>
          <li>• Discount percentage is calculated automatically</li>
          <li>• Products with discounts will show "SALE" badge</li>
        </ul>
      </div>
    </div>
  )
}
