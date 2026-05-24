-- Add slug column to categories table
ALTER TABLE categories ADD COLUMN slug TEXT;

-- Create unique index on slug to ensure no duplicates
CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);

-- Update existing categories with slugs based on their names
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(name_en, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE slug IS NULL;

-- Clean up the slugs (replace spaces and multiple hyphens with single hyphen)
UPDATE categories 
SET slug = REGEXP_REPLACE(REGEXP_REPLACE(slug, '\s+', '-', 'g'), '-+', '-', 'g')
WHERE slug IS NOT NULL;

-- Remove leading and trailing hyphens
UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '^-+|-+$', '', 'g')
WHERE slug IS NOT NULL;
