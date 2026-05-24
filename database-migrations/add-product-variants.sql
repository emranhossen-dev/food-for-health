-- Migration: Add Product Variants Table
-- This migration adds support for multiple quantity options with different pricing for each product

-- Create Product Variants table
CREATE TABLE product_variants (
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
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_is_default ON product_variants(is_default);
CREATE INDEX idx_product_variants_sort_order ON product_variants(sort_order);

-- Create trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Product variants are viewable by everyone" ON product_variants FOR SELECT USING (true);

-- Add constraint to ensure only one default variant per product
ALTER TABLE product_variants ADD CONSTRAINT unique_default_variant 
  EXCLUDE (product_id WITH =) WHERE (is_default = TRUE);

-- Add constraint to ensure unique quantity options per product
ALTER TABLE product_variants ADD CONSTRAINT unique_quantity_option_per_product 
  UNIQUE(product_id, quantity_option);

-- Comments for documentation
COMMENT ON TABLE product_variants IS 'Stores different quantity options and pricing for each product';
COMMENT ON COLUMN product_variants.quantity_option IS 'The quantity display text (e.g., "1kg", "500ml", "3pcs")';
COMMENT ON COLUMN product_variants.quantity_type IS 'Type of quantity: weight, volume, or pieces';
COMMENT ON COLUMN product_variants.is_default IS 'Marks which variant should be shown by default in product listings';
COMMENT ON COLUMN product_variants.sort_order IS 'Order in which variants should be displayed';
