'use client'

import { useState } from 'react'
import { Upload, X, Star, Link } from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  file?: File
  is_primary: boolean
}

interface ProductImageManagerProps {
  images: ProductImage[]
  setImages: (images: ProductImage[]) => void
  imageSource: 'upload' | 'link'
  setImageSource: (source: 'upload' | 'link') => void
}

export default function ProductImageManager({
  images,
  setImages,
  imageSource,
  setImageSource
}: ProductImageManagerProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: ProductImage = {
          id: Date.now().toString() + Math.random(),
          url: e.target?.result as string,
          file: file,
          is_primary: images.length === 0
        }
        
        setImages([...images, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      const newImage: ProductImage = {
        id: Date.now().toString() + Math.random(),
        url: url,
        is_primary: images.length === 0
      }
      
      setImages([...images, newImage])
    }
  }

  const removeImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId)
    // If we removed the primary image, make the first one primary
    if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
      newImages[0].is_primary = true
    }
    setImages(newImages)
  }

  const setPrimaryImage = (imageId: string) => {
    setImages(images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })))
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">Product Images</h2>
      
      {/* Image Source Selection */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="upload"
            checked={imageSource === 'upload'}
            onChange={() => setImageSource('upload')}
            className="mr-2"
          />
          <span className="text-white">Upload Files</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="link"
            checked={imageSource === 'link'}
            onChange={() => setImageSource('link')}
            className="mr-2"
          />
          <span className="text-white">Image URLs</span>
        </label>
      </div>

      {/* Image Upload/Add */}
      {imageSource === 'upload' ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Images
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-gray-300">
                Click to upload or drag and drop
              </span>
              <span className="text-gray-500 text-sm">
                PNG, JPG, GIF up to 10MB each
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Add Image URLs
          </label>
          <button
            type="button"
            onClick={handleImageUrlAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Link className="h-4 w-4" />
            Add Image URL
          </button>
        </div>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Image Preview ({images.length} images)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group border-2 rounded-lg overflow-hidden ${
                  image.is_primary ? 'border-blue-500' : 'border-gray-600'
                }`}
              >
                <img
                  src={image.url}
                  alt="Product preview"
                  className="w-full h-24 object-cover"
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Primary
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(image.id)}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400">
            No images added yet. Add images using the options above.
          </div>
        </div>
      )}
    </div>
  )
}
