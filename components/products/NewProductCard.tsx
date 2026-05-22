'use client'

import { Plus } from 'lucide-react'

interface NewProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image: string
  badge?: string
  badgeType?: 'secondary' | 'primary'
}

export default function NewProductCard({
  id,
  name,
  description,
  price,
  image,
  badge,
  badgeType = 'secondary'
}: NewProductCardProps) {
  const getBadgeClasses = () => {
    if (badgeType === 'primary') {
      return 'bg-primary-fixed text-on-primary-fixed'
    }
    return 'bg-secondary-container text-on-secondary-container'
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-[0px_10px_20px_rgba(0,122,51,0.08)] transition-shadow group relative">
      <div className="relative h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={image}
          alt={name}
        />
        {badge && (
          <span className={`absolute top-3 left-3 ${getBadgeClasses()} font-label-sm text-label-sm px-2 py-1 rounded`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 relative">
        <h4 className="font-label-lg text-label-lg text-on-surface mb-1">{name}</h4>
        <p className="text-on-surface-variant font-body-md text-body-md mb-2">{description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="font-headline-md text-headline-md text-primary">${price.toFixed(2)}</span>
          <button className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
