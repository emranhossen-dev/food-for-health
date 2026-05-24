const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mwuomeejtikpsuzquckq.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dW9tZWVqdGlrcHN1enF1Y2txIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MzI1MywiZXhwIjoyMDk1MDQ5MjUzfQ.B6A4MtDP-TggkTlmdp4PZj0PcxjPTXCeGo7j7fLHK1w'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  try {
    console.log('Running database migration...')
    
    // Step 1: Add slug column
    console.log('1. Adding slug column...')
    const { error: addColumnError } = await supabaseAdmin
      .rpc('exec', {
        sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;'
      })
    
    if (addColumnError) {
      console.log('Add column error:', addColumnError.message)
      console.log('Trying direct SQL approach...')
    } else {
      console.log('✓ Slug column added successfully')
    }
    
    // Step 2: Create unique index
    console.log('2. Creating unique index...')
    try {
      await supabaseAdmin
        .rpc('exec', {
          sql: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);'
        })
      console.log('✓ Unique index created')
    } catch (indexError) {
      console.log('Index creation note:', indexError.message)
    }
    
    // Step 3: Update existing categories with slugs
    console.log('3. Updating existing categories with slugs...')
    
    const { data: categories, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('id, name_en, slug')
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError)
      return
    }
    
    console.log(`Found ${categories.length} categories`)
    
    for (const category of categories) {
      if (!category.slug) {
        const slug = category.name_en
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphen
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        
        const { error: updateError } = await supabaseAdmin
          .from('categories')
          .update({ slug })
          .eq('id', category.id)
        
        if (updateError) {
          console.error(`Error updating ${category.name_en}:`, updateError.message)
        } else {
          console.log(`✓ Updated "${category.name_en}" → "${slug}"`)
        }
      } else {
        console.log(`✓ "${category.name_en}" already has slug: "${category.slug}"`)
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('You can now create categories with slugs.')
    
  } catch (error) {
    console.error('Migration failed:', error)
    console.log('\nPlease run the SQL manually in Supabase dashboard:')
    console.log(`ALTER TABLE categories ADD COLUMN slug TEXT;`)
    console.log(`CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);`)
  }
}

runMigration()
