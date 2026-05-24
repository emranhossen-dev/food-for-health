-- Add slug column to products table
ALTER TABLE products ADD COLUMN slug TEXT;

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
