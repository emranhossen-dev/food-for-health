'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AddProductForm from '@/components/admin/AddProductForm'

export default function AddProductPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Add New Product</h1>
        <p className="text-gray-300 mt-2">Fill in the details below to add a new product</p>
      </div>

      <AddProductForm />
    </div>
  )
}
