'use client'

import { useState } from 'react'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AddProductForm from '@/components/admin/AddProductForm'

export default function AddProductPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Add Product</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
            </div>
          </div>

          <AddProductForm />
        </div>
      </div>
    </div>
  )
}
