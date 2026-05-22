'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'

export default function NewNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Offers', href: '#' },
    { label: 'Products', href: '#', active: true },
    { label: 'Corporate', href: '#' },
    { label: 'Distributor', href: '#' },
    { label: 'Outlets', href: '#' },
    { label: 'Impact Stories', href: '#' }
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <header className="flex flex-col w-full sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-container-max mx-auto w-full px-margin-desktop py-3 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="font-headline-lg text-headline-lg font-bold text-on-primary">
            Food for Health
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-label-lg text-label-lg ${
                  link.active
                    ? 'text-on-primary border-b-2 border-on-primary pb-1'
                    : 'text-on-primary/80 hover:text-on-primary transition-colors'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="text-on-primary p-2 hover:bg-primary-container/20 rounded-full transition-all active:scale-95">
              <Search className="h-5 w-5" />
            </button>
            <button className="text-on-primary p-2 hover:bg-primary-container/20 rounded-full transition-all active:scale-95">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button className="text-on-primary p-2 hover:bg-primary-container/20 rounded-full transition-all active:scale-95">
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-on-primary p-2 hover:bg-primary-container/20 rounded-full transition-all active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-surface shadow-xl transform transition-transform">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-on-surface">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-label-lg text-label-lg transition-colors ${
                    link.active
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className="p-4 border-t border-outline-variant">
              <div className="flex gap-4 justify-center">
                <button className="p-3 text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
                  <Search className="h-5 w-5" />
                </button>
                <button className="p-3 text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                </button>
                <button className="p-3 text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
                  <User className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
