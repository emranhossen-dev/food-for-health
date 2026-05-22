import Navbar from '@/components/layout/Navbar'
import CategorySidebar from '@/components/layout/CategorySidebar'
import PromotionalBanners from '@/components/layout/PromotionalBanners'
import FeaturedProductsCarousel from '@/components/products/FeaturedProductsCarousel'
import MostPopularItems from '@/components/products/MostPopularItems'
import NewArrivalItems from '@/components/products/NewArrivalItems'
import FeaturedCategoryItems from '@/components/products/FeaturedCategoryItems'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section with Sidebars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <CategorySidebar />
          </div>
          
          {/* Right Sidebar - Promotional Banners */}
          <div className="lg:col-span-1">
            <PromotionalBanners />
          </div>
        </div>
      </div>

      {/* Featured Products Carousel */}
      <FeaturedProductsCarousel />

      {/* Most Popular Items Section */}
      <MostPopularItems />

      {/* New Arrival Items Section */}
      <NewArrivalItems />

      {/* Featured Category Items Sections */}
      <FeaturedCategoryItems />
    </div>
  )
}
