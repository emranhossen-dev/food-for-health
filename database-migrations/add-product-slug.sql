-- Add slug column to products table
ALTER TABLE products 
ADD COLUMN slug TEXT;

-- Create unique index on slug to ensure no duplicates
CREATE UNIQUE INDEX idx_products_slug ON products(slug);

-- Create a function to generate slug from product name
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(NEW.name_en, '[^\w\s-]', '', 'g'),
                    '[\s_-]+', '-', 'g'
                ),
                '^[-]+|[-]+$', '', 'g'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug before insert
CREATE TRIGGER generate_product_slug_trigger
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_slug();

-- Create trigger to auto-generate slug before update if slug is empty
CREATE TRIGGER generate_product_slug_update_trigger
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_slug()
    WHEN (OLD.slug IS NULL OR OLD.slug = '');

-- Update existing products to have slugs
UPDATE products 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(name_en, '[^\w\s-]', '', 'g'),
            '[\s_-]+', '-', 'g'
        ),
        '^[-]+|[-]+$', '', 'g'
    )
)
WHERE slug IS NULL OR slug = '';
