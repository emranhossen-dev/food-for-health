'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Grid3X3, 
  Package, 
  PlusCircle, 
  ShoppingCart, 
  Menu, 
  X,
  Image as ImageIcon,
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface SidebarItem {
  label: string
  href: string
  icon: React.ElementType
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Grid3X3
  },
  {
    label: 'All Products',
    href: '/admin/products',
    icon: Package
  },
  {
    label: 'Add Product',
    href: '/admin/products/add',
    icon: PlusCircle
  },
  {
    label: 'Banners',
    href: '/admin/banners',
    icon: ImageIcon
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart
  }
]

interface AdminSidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function AdminSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/admin/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center space-x-3 p-6 border-b border-gray-700">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">FH</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Food for Health</h1>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <span>← Back to Store</span>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-72 bg-gray-800 shadow-sm h-screen sticky top-0">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
