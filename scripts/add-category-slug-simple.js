const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mwuomeejtikpsuzquckq.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dW9tZWVqdGlrcHN1enF1Y2txIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MzI1MywiZXhwIjoyMDk1MDQ5MjUzfQ.B6A4MtDP-TggkTlmdp4PZj0PcxjPTXCeGo7j7fLHK1w'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function addSlugColumn() {
  try {
    console.log('Adding slug column to categories table...')
    
    // First, let's try to get categories to see if slug column exists
    const { data: testCategories, error: testError } = await supabaseAdmin
      .from('categories')
      .select('id, name_en, slug')
      .limit(1)
    
    if (testError && testError.message.includes('column "slug" does not exist')) {
      console.log('Slug column does not exist. Please run the SQL migration manually in Supabase dashboard:')
      console.log('ALTER TABLE categories ADD COLUMN slug TEXT;')
      console.log('Then run this script again to populate the slugs.')
      return
    }
    
    if (testError) {
      console.error('Other error:', testError)
      return
    }
    
    console.log('Slug column exists, checking for categories without slugs...')
    
    // Get all categories without slugs
    const { data: categories, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('id, name_en, slug')
      .is('slug', null)
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError)
      return
    }
    
    console.log(`Found ${categories.length} categories without slugs`)
    
    // Generate slugs for existing categories
    for (const category of categories) {
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
        console.error(`Error updating category ${category.id}:`, updateError)
      } else {
        console.log(`Updated slug for "${category.name_en}" → "${slug}"`)
      }
    }
    
    console.log('Slug migration completed successfully!')
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

addSlugColumn()
