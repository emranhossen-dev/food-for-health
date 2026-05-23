'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar 
          isMobileMenuOpen={false} 
          setIsMobileMenuOpen={() => {}} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Menu Button */}
        <div className="lg:hidden bg-gray-800 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-gray-800">
            <AdminSidebar 
              isMobileMenuOpen={true} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
