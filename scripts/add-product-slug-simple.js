// Simple script to add slug column to products table
// Run this in the Supabase SQL Editor directly

const sql = `
-- Add slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Update existing products to have slugs
UPDATE products 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(COALESCE(name_en, ''), '[^\w\s-]', '', 'g'),
            '[\s_-]+', '-', 'g'
        ),
        '^[-]+|[-]+$', '', 'g'
    )
)
WHERE slug IS NULL OR slug = '';
`;

console.log('Please run this SQL in your Supabase SQL Editor:');
console.log(sql);
