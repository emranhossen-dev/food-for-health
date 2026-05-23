'use client'

import ProductCard from '@/components/products/ProductCard'

const mockProduct = {
  id: '1',
  name_en: 'Darjeeling Black Tea',
  name_bn: 'দার্জিলিং ব্ল্যাক টি',
  description: 'Premium Darjeeling black tea from the hills of West Bengal',
  current_price: 380,
  old_price: 450,
  discount_percentage: 16,
  stock_quantity: 50,
  unit: 'gram',
  unit_type: 'solid' as const,
  status: 'best_selling' as const,
  product_images: [
    {
      id: '1',
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231dee793?w=400&h=400&fit=crop',
      is_primary: true
    }
  ],
  quantity_prices: {
    '250g': {
      current_price: 380,
      old_price: 450,
      discount_percentage: 16
    },
    '500g': {
      current_price: 720,
      old_price: 850,
      discount_percentage: 15
    },
    '1kg': {
      current_price: 1380,
      old_price: 1650,
      discount_percentage: 16
    }
  }
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Product Card Demo</h1>
        
        <div className="max-w-sm mx-auto">
          <ProductCard product={mockProduct} />
        </div>
      </div>
    </div>
  )
}
