'use client'

import { useState, useEffect } from 'react'
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

const BANNER_POSITIONS = [
  { value: 'top_left', label: 'Top Left' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'bottom_1', label: 'Bottom 1' },
  { value: 'bottom_2', label: 'Bottom 2' },
  { value: 'bottom_3', label: 'Bottom 3' }
]

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    target_url: '',
    banner_position: 'bottom_1',
    is_active: true
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      console.log('Submitting banner data:', formData)
      
      if (editingId) {
        console.log('Updating banner with ID:', editingId)
        const { error } = await supabase
          .from('promotional_banners')
          .update(formData)
          .eq('id', editingId)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        console.log('Banner updated successfully')
      } else {
        console.log('Creating new banner')
        const { error } = await supabase
          .from('promotional_banners')
          .insert([formData])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        console.log('Banner created successfully')
      }

      // Reset form
      setFormData({
        title: '',
        image_url: '',
        target_url: '',
        banner_position: 'bottom_1',
        is_active: true
      })
      setEditingId(null)
      fetchBanners()
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Error saving banner: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url,
      banner_position: banner.banner_position,
      is_active: banner.is_active
    })
    setEditingId(banner.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Error deleting banner')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Uploading image file:', file.name)
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `banners/${fileName}`

      console.log('Uploading to path:', filePath)
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
      console.log('Image uploaded successfully')

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)
      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading banners...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Banner Management</h1>

      {/* Add/Edit Banner Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Banner' : 'Add New Banner'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Preview"
                className="mt-2 h-20 w-20 object-cover rounded"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target URL
            </label>
            <input
              type="text"
              value={formData.target_url}
              onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
              placeholder="/products/product-id or /category/category-id"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Position
            </label>
            <select
              value={formData.banner_position}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_position: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BANNER_POSITIONS.map(pos => {
                const isOccupied = banners.some(b => b.banner_position === pos.value && b.is_active)
                return (
                  <option 
                    key={pos.value} 
                    value={pos.value}
                    disabled={isOccupied && !editingId}
                  >
                    {pos.label}{isOccupied && !editingId ? ' (Occupied)' : ''}
                  </option>
                )
              })}
            </select>
            {!editingId && banners.some(b => b.banner_position === formData.banner_position && b.is_active) && (
              <p className="text-xs text-red-600 mt-1">This position is already occupied</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    title: '',
                    image_url: '',
                    target_url: '',
                    banner_position: 'bottom_1',
                    is_active: true
                  })
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Banners List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Banners</h2>
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    {banner.image_url && (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{banner.title || 'No title'}</h3>
                      <p className="text-sm text-gray-600">Position: {banner.banner_position}</p>
                      <p className="text-sm text-gray-600">Target: {banner.target_url}</p>
                      <p className="text-sm text-gray-600">
                        Status: {banner.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
