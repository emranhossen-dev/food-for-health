// SQL to create product_variants table
// Run this in your Supabase SQL Editor

const sql = `-- Create Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_option TEXT NOT NULL,
  quantity_type TEXT NOT NULL CHECK (quantity_type IN ('weight', 'volume', 'pieces')),
  current_price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  discount_percentage INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_default ON product_variants(is_default);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY IF NOT EXISTS "Product variants are viewable by everyone" ON product_variants FOR SELECT USING (true);

-- Add unique constraint
ALTER TABLE product_variants ADD CONSTRAINT IF NOT EXISTS unique_quantity_option_per_product 
  UNIQUE(product_id, quantity_option);`;

console.log('Please run this SQL in your Supabase SQL Editor:');
console.log(sql);
console.log('\nAfter running this SQL, your product form will work with variants!');
