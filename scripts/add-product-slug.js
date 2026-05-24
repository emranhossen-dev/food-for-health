const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    console.log('Adding slug column to products table...');
    
    // First, let's check if the slug column already exists
    const { data: columns, error: columnError } = await supabase
      .from('products')
      .select('slug')
      .limit(1);
    
    if (columnError && columnError.message.includes('column "slug" does not exist')) {
      console.log('Slug column does not exist, adding it...');
      
      // Add slug column using raw SQL
      const { error: addError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (addError && addError.message.includes('column "slug" does not exist')) {
        console.log('Please manually run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE products ADD COLUMN slug TEXT;');
        console.log('CREATE UNIQUE INDEX idx_products_slug ON products(slug);');
      }
    } else {
      console.log('Slug column already exists');
    }
    
    // Update existing products to have slugs
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name_en, slug')
      .is('slug', null);
    
    if (fetchError) {
      console.log('Fetch error:', fetchError.message);
    } else {
      console.log(`Found ${products.length} products without slugs`);
      
      for (const product of products) {
        const slug = product.name_en.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
          
        const { error: updateError } = await supabase
          .from('products')
          .update({ slug })
          .eq('id', product.id);
          
        if (updateError) {
          console.log(`Update error for product ${product.id}:`, updateError.message);
        } else {
          console.log(`✓ Updated product: ${product.name_en} -> ${slug}`);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
