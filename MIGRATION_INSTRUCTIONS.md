# Database Migration Instructions

## Problem
The `slug` column doesn't exist in the `categories` table, causing the error:
"Could not find the 'slug' column of 'categories' in the schema cache"

## Solution
Run these SQL commands in your Supabase dashboard:

### Steps:
1. Go to https://supabase.com/dashboard
2. Select your project: `mwuomeejtikpsuzquckq`
3. Click on "SQL Editor" in the left sidebar
4. Run these commands one by one:

```sql
-- Command 1: Add slug column
ALTER TABLE categories ADD COLUMN slug TEXT;
```

```sql
-- Command 2: Create unique index (optional but recommended)
CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
```

```sql
-- Command 3: Update existing categories with slugs
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(name_en, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE slug IS NULL;
```

```sql
-- Command 4: Clean up slugs (replace spaces with hyphens)
UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
WHERE slug IS NOT NULL;
```

```sql
-- Command 5: Remove multiple hyphens
UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
WHERE slug IS NOT NULL;
```

```sql
-- Command 6: Remove leading/trailing hyphens
UPDATE categories 
SET slug = REGEXP_REPLACE(slug, '^-+|-+$', '', 'g')
WHERE slug IS NOT NULL;
```

## Verification
After running the migration, you can verify it worked:

```sql
-- Check if slugs were created
SELECT id, name_en, slug FROM categories;
```

## What This Fixes
- ✅ Allows creating new categories with automatic slug generation
- ✅ Enables clean URLs like `localhost:3000/category/fresh-fruits/`
- ✅ Fixes the "Could not find the 'slug' column" error
- ✅ Maintains backward compatibility with existing categories

## After Migration
Once you run these SQL commands:
1. Restart your development server
2. Try creating a new category in the admin panel
3. The slug will be auto-generated from the category name
4. Categories will be accessible via clean URLs
