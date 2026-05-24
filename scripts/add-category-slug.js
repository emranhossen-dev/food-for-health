const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function addSlugColumn() {
  try {
    console.log('Adding slug column to categories table...')
    
    // Add the slug column
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;'
    })
    
    if (alterError) {
      console.error('Error adding column:', alterError)
      return
    }
    
    console.log('Slug column added successfully')
    
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
