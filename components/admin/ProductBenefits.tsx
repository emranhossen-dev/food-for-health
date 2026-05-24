'use client'

import { useState } from 'react'
import { Plus, X, Heart } from 'lucide-react'

interface ProductBenefitsProps {
  key_health_benefits: string[]
  setKeyHealthBenefits: (benefits: string[]) => void
  benefitInput: string
  setBenefitInput: (input: string) => void
}

export default function ProductBenefits({
  key_health_benefits,
  setKeyHealthBenefits,
  benefitInput,
  setBenefitInput
}: ProductBenefitsProps) {
  const addBenefit = () => {
    if (benefitInput.trim()) {
      setKeyHealthBenefits([...key_health_benefits, benefitInput.trim()])
      setBenefitInput('')
    }
  }

  const removeBenefit = (index: number) => {
    setKeyHealthBenefits(key_health_benefits.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addBenefit()
    }
  }

  const suggestedBenefits = [
    'প্রয়োজনীয় পুষ্টিতে সমৃদ্ধ',
    'সামগ্রিক স্বাস্থ্য এবং সুস্থতাকে সমর্থন করে',
    'প্রাকৃতিক উপাদান দিয়ে তৈরি',
    'ক্ষতিকারক সংযোজন থেকে মুক্ত',
    'সর্বোত্তম সুবিধার জন্য বৈজ্ঞানিকভাবে তৈরি',
    'ইমিউন সিস্টেম শক্তিশালী করে',
    'হজম স্বাস্থ্য উন্নত করে',
    'শক্তি বাড়ায়',
    'ত্বকের স্বাস্থ্যের জন্য উপকারী',
    'হৃদয়ের স্বাস্থ্য রক্ষা করে'
  ]

  const addSuggestedBenefit = (benefit: string) => {
    if (!key_health_benefits.includes(benefit)) {
      setKeyHealthBenefits([...key_health_benefits, benefit])
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-400" />
        Key Health Benefits
      </h2>
      
      {/* Add Benefit Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add Health Benefit
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={benefitInput}
            onChange={(e) => setBenefitInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a health benefit..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={addBenefit}
            disabled={!benefitInput.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Current Benefits */}
      {key_health_benefits.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Benefits ({key_health_benefits.length})
          </label>
          <div className="space-y-2">
            {key_health_benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2"
              >
                <span className="text-white">{benefit}</span>
                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Benefits */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Suggested Benefits (Click to add)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {suggestedBenefits.map((benefit, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addSuggestedBenefit(benefit)}
              disabled={key_health_benefits.includes(benefit)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                key_health_benefits.includes(benefit)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {benefit}
            </button>
          ))}
        </div>
      </div>

      {/* Benefits Tips */}
      <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
        <h4 className="text-green-400 font-medium mb-2">💚 Benefits Tips</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Add specific, measurable benefits</li>
          <li>• Use both English and Bangla when appropriate</li>
          <li>• Focus on what makes your product unique</li>
          <li>• Include scientific backing if available</li>
          <li>• Keep benefits concise and easy to understand</li>
        </ul>
      </div>
    </div>
  )
}
