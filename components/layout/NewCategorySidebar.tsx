'use client'

import { useState } from 'react'
import { Grid3X3, Leaf, Star, Utensils, Coffee, Package, Droplet, Brain } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: React.ElementType
  active?: boolean
}

export default function NewCategorySidebar() {
  const [activeCategory, setActiveCategory] = useState('all-products')

  const categories: Category[] = [
    {
      id: 'all-products',
      name: 'All Products',
      icon: Grid3X3,
      active: activeCategory === 'all-products'
    },
    {
      id: 'seasonal-fruits',
      name: 'Seasonal Fruits',
      icon: Leaf,
      active: activeCategory === 'seasonal-fruits'
    },
    {
      id: 'eid-special',
      name: 'Eid Special',
      icon: Star,
      active: activeCategory === 'eid-special'
    },
    {
      id: 'poultry-meat',
      name: 'Poultry & Meat',
      icon: Utensils,
      active: activeCategory === 'poultry-meat'
    },
    {
      id: 'rice-grains',
      name: 'Rice & Grains',
      icon: Coffee,
      active: activeCategory === 'rice-grains'
    },
    {
      id: 'honey',
      name: 'Honey',
      icon: Package,
      active: activeCategory === 'honey'
    },
    {
      id: 'oil',
      name: 'Oil',
      icon: Droplet,
      active: activeCategory === 'oil'
    },
    {
      id: 'super-foods',
      name: 'Super Foods',
      icon: Brain,
      active: activeCategory === 'super-foods'
    }
  ]

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  return (
    <aside className="hidden lg:flex flex-col sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto w-64 rounded-r-xl bg-surface border-r border-outline-variant pr-4 hide-scrollbar">
      <div className="mb-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary pt-4">Categories</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Shop by Health Needs</p>
      </div>
      
      <nav className="flex flex-col gap-1">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                category.active
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate whitespace-nowrap">{category.name}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
