// Script to create product_variants table
// Run this SQL in your Supabase SQL Editor

const sql = `
-- Create Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_option TEXT NOT NULL, -- e.g., '1kg', '500ml', '1pc', '3pcs', '5L'
  quantity_type TEXT NOT NULL CHECK (quantity_type IN ('weight', 'volume', 'pieces')),
  current_price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  discount_percentage INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE, -- Mark one variant as the default display variant
  sort_order INTEGER DEFAULT 0, -- For ordering variants in UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_default ON product_variants(is_default);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort_order ON product_variants(sort_order);

-- Enable Row Level Security (RLS)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY IF NOT EXISTS "Product variants are viewable by everyone" ON product_variants FOR SELECT USING (true);

-- Add constraint to ensure unique quantity options per product
ALTER TABLE product_variants ADD CONSTRAINT IF NOT EXISTS unique_quantity_option_per_product 
  UNIQUE(product_id, quantity_option);
`;

console.log('Please run this SQL in your Supabase SQL Editor:');
console.log(sql);
