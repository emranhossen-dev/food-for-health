'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FeaturedProductsCarousel from '@/components/products/FeaturedProductsCarousel'

interface Banner {
  id: string
  title?: string
  image_url: string
  target_url?: string
  banner_position: 'top_left' | 'top_right'
  is_active: boolean
}

export default function PromotionalBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .in('banner_position', ['top_left', 'top_right'])
        .order('banner_position')

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBannerByPosition = (position: Banner['banner_position']) => {
    return banners.find(banner => banner.banner_position === position)
  }

  if (loading) {
    return (
      <div className="w-full h-[80vh] bg-white rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
        {/* Top Section - 50vh */}
        <div className="h-[50vh] mb-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="animate-pulse bg-gray-200 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        {/* Bottom Section - Featured Products Carousel */}
        <div className="h-[30vh] flex-shrink-0">
          <div className="animate-pulse bg-gray-200 rounded-lg h-full"></div>
        </div>
      </div>
    )
  }

  const topLeftBanner = getBannerByPosition('top_left')
  const topRightBanner = getBannerByPosition('top_right')

  const BannerLink = ({ banner, className }: { banner: Banner, className: string }) => {
    const content = (
      <div className={className}>
        <img
          src={banner.image_url}
          alt={banner.title || 'Promotional banner'}
          className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
        />
      </div>
    )

    if (banner.target_url) {
      return <Link href={banner.target_url}>{content}</Link>
    }
    return content
  }

  return (
    <div className="w-full h-[80vh] bg-white rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
      {/* Top Section - 50vh */}
      <div className="h-[50vh] mb-4">
        <div className="grid grid-cols-2 gap-4 h-full">
          {topLeftBanner && (
            <BannerLink 
              banner={topLeftBanner} 
              className="h-full relative overflow-hidden rounded-lg"
            />
          )}
          {topRightBanner && (
            <BannerLink 
              banner={topRightBanner} 
              className="h-full relative overflow-hidden rounded-lg"
            />
          )}
          {!topLeftBanner && (
            <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">No banner available</p>
            </div>
          )}
          {!topRightBanner && (
            <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">No banner available</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Featured Products Carousel */}
      <div className="h-[30vh] flex-shrink-0">
        <FeaturedProductsCarousel />
      </div>
    </div>
  )
}
