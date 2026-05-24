'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name_en: string
  name_bn?: string
}

interface BulkProductUploadProps {
  uploadMode: 'manual' | 'bulk'
  setUploadMode: (mode: 'manual' | 'bulk') => void
  bulkData: string
  setBulkData: (data: string) => void
  bulkJsonData: string
  setBulkJsonData: (data: string) => void
  bulkProducts: any[]
  setBulkProducts: (products: any[]) => void
  uploadFormat: 'csv' | 'json'
  setUploadFormat: (format: 'csv' | 'json') => void
  bulkInstruction: string
  setBulkInstruction: (instruction: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: Category[]
}

export default function BulkProductUpload({
  uploadMode,
  setUploadMode,
  bulkData,
  setBulkData,
  bulkJsonData,
  setBulkJsonData,
  bulkProducts,
  setBulkProducts,
  uploadFormat,
  setUploadFormat,
  bulkInstruction,
  setBulkInstruction,
  selectedCategory,
  setSelectedCategory,
  categories
}: BulkProductUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      toast.error('CSV data must have at least a header row and one data row')
      return []
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const products = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue

      const product: any = {}
      headers.forEach((header, index) => {
        product[header] = values[index]
      })

      // Add default values for required fields
      if (!product.category_id && selectedCategory) {
        product.category_id = selectedCategory
      }
      if (!product.unit_type) {
        product.unit_type = 'solid'
      }
      if (!product.status) {
        product.status = 'none'
      }

      products.push(product)
    }

    return products
  }

  const parseJSON = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        toast.error('JSON data must be an array of products')
        return []
      }

      return parsed.map(product => ({
        ...product,
        category_id: product.category_id || selectedCategory,
        unit_type: product.unit_type || 'solid',
        status: product.status || 'none'
      }))
    } catch (error) {
      toast.error('Invalid JSON format')
      return []
    }
  }

  const processBulkData = () => {
    setIsProcessing(true)
    
    try {
      let products = []
      
      if (uploadFormat === 'csv') {
        products = parseCSV(bulkData)
      } else {
        products = parseJSON(bulkJsonData)
      }

      if (products.length > 0) {
        setBulkProducts(products)
        toast.success(`Successfully processed ${products.length} products`)
      } else {
        toast.error('No valid products found in the data')
      }
    } catch (error) {
      toast.error('Error processing bulk data')
      console.error('Bulk processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleCSV = `name_en,name_bn,description,current_price,old_price,stock_quantity,unit,unit_type,category_id
"Sample Product","নমুনা পণ্য","This is a sample product description","100","150","50","500g","solid","${categories[0]?.id || ''}"`
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_products.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadSampleJSON = () => {
    const sampleJSON = [
      {
        name_en: "Sample Product",
        name_bn: "নমুনা পণ্য",
        description: "This is a sample product description",
        current_price: "100",
        old_price: "150",
        stock_quantity: "50",
        unit: "500g",
        unit_type: "solid",
        category_id: categories[0]?.id || ""
      }
    ]
    
    const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_products.json'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (uploadMode !== 'bulk') {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Upload Mode</h2>
          <button
            type="button"
            onClick={() => setUploadMode('bulk')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Switch to Bulk Upload
          </button>
        </div>
        <p className="text-gray-400">Currently in manual mode. Click the button above to switch to bulk upload.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Bulk Product Upload</h2>
        <button
          type="button"
          onClick={() => setUploadMode('manual')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Switch to Manual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Default Category (for products without category)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select default category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en} {category.name_bn && `(${category.name_bn})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Format
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="csv"
                checked={uploadFormat === 'csv'}
                onChange={(e) => setUploadFormat(e.target.value as 'csv' | 'json')}
                className="mr-2"
              />
              <span className="text-white">CSV</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="json"
                checked={uploadFormat === 'json'}
                onChange={(e) => setUploadFormat(e.target.value as 'csv' | 'json')}
                className="mr-2"
              />
              <span className="text-white">JSON</span>
            </label>
          </div>
        </div>
      </div>

      {uploadFormat === 'csv' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              CSV Data
            </label>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download Sample
            </button>
          </div>
          <textarea
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder="Paste your CSV data here...&#10;Format: name_en,name_bn,description,current_price,old_price,stock_quantity,unit,unit_type,category_id"
            rows={10}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              JSON Data
            </label>
            <button
              type="button"
              onClick={downloadSampleJSON}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download Sample
            </button>
          </div>
          <textarea
            value={bulkJsonData}
            onChange={(e) => setBulkJsonData(e.target.value)}
            placeholder="Paste your JSON data here...&#10;Format: [{ name_en: '', name_bn: '', description: '', ... }]"
            rows={10}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bulk Instructions (Optional)
        </label>
        <textarea
          value={bulkInstruction}
          onChange={(e) => setBulkInstruction(e.target.value)}
          placeholder="Any special instructions for bulk processing..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={processBulkData}
          disabled={isProcessing || (!bulkData.trim() && !bulkJsonData.trim())}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Process Data'}
        </button>
      </div>

      {bulkProducts.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">
            Preview ({bulkProducts.length} products)
          </h3>
          <div className="max-h-40 overflow-y-auto">
            <pre className="text-gray-300 text-xs">
              {JSON.stringify(bulkProducts.slice(0, 3), null, 2)}
              {bulkProducts.length > 3 && '\n... and ' + (bulkProducts.length - 3) + ' more'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
