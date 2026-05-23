'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Banner {
  id: string
  title: string
  image_url: string
  target_url: string
  banner_position: 'top_left' | 'top_right' | 'bottom_1' | 'bottom_2' | 'bottom_3'
  is_active: boolean
  created_at: string
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [leftBannerData, setLeftBannerData] = useState({
    title: '',
    image_url: '',
    target_url: '',
    is_active: true
  })
  const [rightBannerData, setRightBannerData] = useState({
    title: '',
    image_url: '',
    target_url: '',
    is_active: true
  })
  const [carouselBanners, setCarouselBanners] = useState<Array<{
    id?: string
    title: string
    image_url: string
    target_url: string
    is_active: boolean
  }>>([
    { title: '', image_url: '', target_url: '', is_active: true },
    { title: '', image_url: '', target_url: '', is_active: true },
    { title: '', image_url: '', target_url: '', is_active: true }
  ])

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    // Pre-fill forms with existing banner data
    const leftBanner = banners.find(b => b.banner_position === 'top_left')
    const rightBanner = banners.find(b => b.banner_position === 'top_right')
    const bottomBanners = banners.filter(b => b.banner_position.startsWith('bottom_')).sort((a, b) => a.banner_position.localeCompare(b.banner_position))

    if (leftBanner) {
      setLeftBannerData({
        title: leftBanner.title,
        image_url: leftBanner.image_url,
        target_url: leftBanner.target_url,
        is_active: leftBanner.is_active
      })
    }

    if (rightBanner) {
      setRightBannerData({
        title: rightBanner.title,
        image_url: rightBanner.image_url,
        target_url: rightBanner.target_url,
        is_active: rightBanner.is_active
      })
    }

    // Update carousel banners
    const newCarouselBanners = [...carouselBanners]
    bottomBanners.forEach((banner, index) => {
      if (index < 3) {
        newCarouselBanners[index] = {
          id: banner.id,
          title: banner.title,
          image_url: banner.image_url,
          target_url: banner.target_url,
          is_active: banner.is_active
        }
      }
    })
    setCarouselBanners(newCarouselBanners)
  }, [banners])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('promotional_banners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleTopBannerSubmit = async (position: 'top_left' | 'top_right', data: typeof leftBannerData) => {
    setLoading(true)
    try {
      const existingBanner = banners.find(b => b.banner_position === position)
      
      if (existingBanner) {
        // Update existing banner
        const { error } = await supabaseAdmin
          .from('promotional_banners')
          .update({
            title: data.title,
            image_url: data.image_url,
            target_url: data.target_url,
            is_active: data.is_active
          })
          .eq('id', existingBanner.id)

        if (error) throw error
        toast.success(`${position === 'top_left' ? 'Left' : 'Right'} banner updated successfully!`)
      } else {
        // Create new banner
        const { error } = await supabaseAdmin
          .from('promotional_banners')
          .insert({
            title: data.title,
            image_url: data.image_url,
            target_url: data.target_url,
            banner_position: position,
            is_active: data.is_active
          })

        if (error) throw error
        toast.success(`${position === 'top_left' ? 'Left' : 'Right'} banner added successfully!`)
      }

      fetchBanners()
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error('Failed to save banner')
    } finally {
      setLoading(false)
    }
  }

  const handleCarouselBannerSubmit = async (index: number, data: typeof carouselBanners[0]) => {
    setLoading(true)
    try {
      const position = `bottom_${index + 1}` as Banner['banner_position']
      const existingBanner = banners.find(b => b.banner_position === position)
      
      if (existingBanner) {
        // Update existing banner
        const { error } = await supabaseAdmin
          .from('promotional_banners')
          .update({
            title: data.title,
            image_url: data.image_url,
            target_url: data.target_url,
            is_active: data.is_active
          })
          .eq('id', existingBanner.id)

        if (error) throw error
        toast.success(`Carousel Banner ${index + 1} updated successfully!`)
      } else if (data.title || data.image_url) {
        // Create new banner only if there's data
        const { error } = await supabaseAdmin
          .from('promotional_banners')
          .insert({
            title: data.title,
            image_url: data.image_url,
            target_url: data.target_url,
            banner_position: position,
            is_active: data.is_active
          })

        if (error) throw error
        toast.success(`Carousel Banner ${index + 1} added successfully!`)
      }

      fetchBanners()
    } catch (error) {
      console.error('Error saving carousel banner:', error)
      toast.error('Failed to save carousel banner')
    } finally {
      setLoading(false)
    }
  }

  const addCarouselBanner = () => {
    setCarouselBanners([...carouselBanners, { title: '', image_url: '', target_url: '', is_active: true }])
  }

  const removeCarouselBanner = async (index: number) => {
    const banner = carouselBanners[index]
    if (banner.id) {
      try {
        const { error } = await supabaseAdmin
          .from('promotional_banners')
          .delete()
          .eq('id', banner.id)

        if (error) throw error
        toast.success('Carousel banner deleted successfully!')
        fetchBanners()
      } catch (error) {
        console.error('Error deleting banner:', error)
        toast.error('Failed to delete banner')
      }
    } else {
      // Just remove from local state if it's not saved yet
      const newCarouselBanners = carouselBanners.filter((_, i) => i !== index)
      setCarouselBanners(newCarouselBanners)
    }
  }

  const getPositionLabel = (position: string) => {
    const labels = {
      top_left: 'Top Left',
      top_right: 'Top Right',
      bottom_1: 'Carousel Banner 1',
      bottom_2: 'Carousel Banner 2',
      bottom_3: 'Carousel Banner 3'
    }
    return labels[position as keyof typeof labels] || position
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Banner Management</h1>
      </div>

      {/* Top Banners Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Top Banners</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Banner Form */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Left Banner</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleTopBannerSubmit('top_left', leftBannerData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={leftBannerData.title}
                  onChange={(e) => setLeftBannerData({ ...leftBannerData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter banner title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="url"
                  value={leftBannerData.image_url}
                  onChange={(e) => setLeftBannerData({ ...leftBannerData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target URL</label>
                <input
                  type="url"
                  value={leftBannerData.target_url}
                  onChange={(e) => setLeftBannerData({ ...leftBannerData, target_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="/products?category=fruits"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="left_active"
                  checked={leftBannerData.is_active}
                  onChange={(e) => setLeftBannerData({ ...leftBannerData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary bg-gray-600 border-gray-500 rounded focus:ring-primary"
                />
                <label htmlFor="left_active" className="ml-2 text-sm text-gray-300">Active</label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Left Banner
              </button>
            </form>
          </div>

          {/* Right Banner Form */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Right Banner</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleTopBannerSubmit('top_right', rightBannerData); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={rightBannerData.title}
                  onChange={(e) => setRightBannerData({ ...rightBannerData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter banner title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="url"
                  value={rightBannerData.image_url}
                  onChange={(e) => setRightBannerData({ ...rightBannerData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target URL</label>
                <input
                  type="url"
                  value={rightBannerData.target_url}
                  onChange={(e) => setRightBannerData({ ...rightBannerData, target_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="/products?category=fruits"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="right_active"
                  checked={rightBannerData.is_active}
                  onChange={(e) => setRightBannerData({ ...rightBannerData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary bg-gray-600 border-gray-500 rounded focus:ring-primary"
                />
                <label htmlFor="right_active" className="ml-2 text-sm text-gray-300">Active</label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Right Banner
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Carousel Banners Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Carousel Banners</h2>
          <button
            onClick={addCarouselBanner}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Carousel Banner
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carouselBanners.map((banner, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Carousel Banner {index + 1}</h3>
                {carouselBanners.length > 3 && (
                  <button
                    onClick={() => removeCarouselBanner(index)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCarouselBannerSubmit(index, banner); }} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => {
                      const newCarouselBanners = [...carouselBanners]
                      newCarouselBanners[index] = { ...banner, title: e.target.value }
                      setCarouselBanners(newCarouselBanners)
                    }}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Enter banner title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={banner.image_url}
                    onChange={(e) => {
                      const newCarouselBanners = [...carouselBanners]
                      newCarouselBanners[index] = { ...banner, image_url: e.target.value }
                      setCarouselBanners(newCarouselBanners)
                    }}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Target URL</label>
                  <input
                    type="url"
                    value={banner.target_url}
                    onChange={(e) => {
                      const newCarouselBanners = [...carouselBanners]
                      newCarouselBanners[index] = { ...banner, target_url: e.target.value }
                      setCarouselBanners(newCarouselBanners)
                    }}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="/products?category=fruits"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`carousel_active_${index}`}
                    checked={banner.is_active}
                    onChange={(e) => {
                      const newCarouselBanners = [...carouselBanners]
                      newCarouselBanners[index] = { ...banner, is_active: e.target.checked }
                      setCarouselBanners(newCarouselBanners)
                    }}
                    className="h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-600"
                  />
                  <label htmlFor={`carousel_active_${index}`} className="ml-2 text-sm text-gray-300">Active</label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Carousel Banner {index + 1}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Banners List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">All Banners</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Banner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No banners found. Add your first banner above!
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                          {banner.image_url ? (
                            <img
                              src={banner.image_url}
                              alt={banner.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.jpg'
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {banner.title || 'Untitled Banner'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {getPositionLabel(banner.banner_position)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {banner.target_url ? (
                        <a
                          href={banner.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          {banner.target_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        banner.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(banner.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
