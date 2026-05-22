'use client'

import { Package2, Truck } from 'lucide-react'

export default function CorporateGifting() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter h-auto md:h-80">
        {/* Corporate Gifting Section */}
        <div className="md:col-span-2 bg-primary-container text-on-primary-container rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 max-w-md">
            <h2 className="font-headline-lg text-headline-lg mb-4">Corporate Gifting & Bulk</h2>
            <p className="font-body-lg text-body-lg opacity-90 mb-6">
              Elevate your employee wellness programs or stock your outlets with the purest organic produce. Custom packages available.
            </p>
            <button className="bg-secondary-container text-on-secondary-container font-label-lg text-label-lg px-6 py-3 rounded-full hover:shadow-lg transition-all active:scale-95">
              Contact Distributor
            </button>
          </div>
          
          {/* Abstract Background Decoration */}
          <div className="absolute right-0 top-0 w-64 h-full bg-white/5 skew-x-12 -mr-16"></div>
          <div className="absolute right-12 bottom-12 opacity-20">
            <Package2 className="text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }} />
          </div>
        </div>

        {/* Same Day Delivery Section */}
        <div className="bg-secondary-fixed text-on-secondary-fixed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <Truck className="text-4xl mb-4" />
          <h3 className="font-headline-md text-headline-md mb-2">Same Day Delivery</h3>
          <p className="font-body-md text-body-md opacity-80">
            For all bulk orders within the metro area. Freshness guaranteed from farm to fork.
          </p>
        </div>
      </div>
    </section>
  )
}
