'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Banner {
  id: string
  title: string
  image_url: string
  target_url: string
  banner_position: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function FeaturedProductsCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          return prevIndex >= banners.length - 1 ? 0 : prevIndex + 1
        })
      }, 5000) // Auto-scroll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      console.log('=== DEBUG: Fetching carousel banners ===')
      
      // First, let's see all banners to debug
      const { data: allBanners, error: allError } = await supabase
        .from('promotional_banners')
        .select('*')
      
      console.log('All banners in database:', allBanners)
      
      // Now fetch only carousel banners
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .in('banner_position', ['bottom_1', 'bottom_2', 'bottom_3'])
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched carousel banners:', data)
      console.log('Number of carousel banners:', data?.length || 0)
      console.log('Carousel banner details:', data?.map(b => ({ id: b.id, position: b.banner_position, title: b.title, image_url: b.image_url, is_active: b.is_active })))
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching carousel banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, Math.ceil(banners.length / 3) - 1)
      return prevIndex <= 0 ? maxIndex : prevIndex - 1
    })
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, Math.ceil(banners.length / 3) - 1)
      return prevIndex >= maxIndex ? 0 : prevIndex + 1
    })
  }

  const getVisibleBanners = () => {
    const start = currentIndex * 3
    const visible = banners.slice(start, start + 3)
    console.log('Current index:', currentIndex)
    console.log('Visible banners:', visible)
    return visible
  }

  const totalPages = Math.ceil(banners.length / 3)

  const handleBannerClick = (banner: Banner) => {
    if (banner.target_url) {
      // Navigate to target URL
      window.location.href = banner.target_url
    }
  }

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    console.log('No carousel banners found, showing fallback')
    return (
      <div className="w-full py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-500">No carousel banners found. Add carousel banners from admin panel to display here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Banner Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getVisibleBanners().map((banner) => (
              <div 
                key={banner.id} 
                className="cursor-pointer"
                onClick={() => handleBannerClick(banner)}
              >
                <div className="relative h-48 rounded-lg overflow-hidden">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  {banner.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h2 className="text-white text-lg font-bold">{banner.title}</h2>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Navigation Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
