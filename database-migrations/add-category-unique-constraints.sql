-- Add unique constraints to categories table
-- This prevents duplicate category names and slugs

-- Step 1: Add slug column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='slug') THEN
        ALTER TABLE categories ADD COLUMN slug TEXT;
        RAISE NOTICE 'Slug column added';
    END IF;
END $$;

-- Step 2: Generate slugs for categories that don't have them
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(name_en, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- Step 3: Clean up slugs (replace spaces with hyphens, remove multiple hyphens)
UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
WHERE slug IS NOT NULL;

UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
WHERE slug IS NOT NULL;

UPDATE categories 
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;

-- Step 4: Handle any existing duplicates by renaming them
-- Handle name duplicates
UPDATE categories 
SET name_en = name_en || ' (Duplicate ' || (rn - 1) || ')'
FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY LOWER(name_en) ORDER BY created_at) as rn
    FROM categories
) name_duplicates
WHERE categories.id = name_duplicates.id 
  AND name_duplicates.rn > 1;

-- Handle slug duplicates
UPDATE categories 
SET slug = categories.slug || '-duplicate-' || (slug_duplicates.rn - 1)
FROM (
    SELECT id, slug,
           ROW_NUMBER() OVER (PARTITION BY LOWER(slug) ORDER BY created_at) as rn
    FROM categories
    WHERE slug IS NOT NULL
) slug_duplicates
WHERE categories.id = slug_duplicates.id 
  AND slug_duplicates.rn > 1;

-- Step 5: Add unique constraints using triggers (since PostgreSQL doesn't support unique constraints on expression indexes)
-- Create unique indexes for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_en_unique_idx ON categories (LOWER(name_en));
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique_idx ON categories (LOWER(slug));

-- Create a function to check for duplicates
CREATE OR REPLACE FUNCTION check_category_unique()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for duplicate name (case-insensitive)
    IF EXISTS (SELECT 1 FROM categories WHERE LOWER(name_en) = LOWER(NEW.name_en) AND id != NEW.id) THEN
        RAISE EXCEPTION 'Category name already exists';
    END IF;
    
    -- Check for duplicate slug (case-insensitive)
    IF NEW.slug IS NOT NULL AND EXISTS (SELECT 1 FROM categories WHERE LOWER(slug) = LOWER(NEW.slug) AND id != NEW.id) THEN
        RAISE EXCEPTION 'Category slug already exists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce uniqueness
DROP TRIGGER IF EXISTS categories_unique_trigger ON categories;
CREATE TRIGGER categories_unique_trigger
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION check_category_unique();

SELECT 'Unique constraints implemented with triggers' as status;
