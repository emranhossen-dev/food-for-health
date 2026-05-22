'use client'

export default function PromotionalBannersNew() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      {/* Banner 1 */}
      <div className="relative h-64 rounded-xl overflow-hidden group cursor-pointer shadow-md">
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5QCOgafwIz8zK6NB2rVXb-u-SedYe1lg6_YNETfBjH6VxrXPpFpQAE-xp0BDSOzaW9wodFKZEphHShhlpkGgFPsc2h2-UH6_UCMJbTsJt6ZXmjGivTm9-7rjV0iBToaxLxkjleA_YJhjMlmLqY_s3We-UZL064Y1LRw7k2dI3PH0uiplWj0AIMZ8PZ8uywqgVqoEXznl08a7Rd7jGStM86gm1bYE1j7Jsv3SQ2ynS5AswbfwWsw0BqAvRTgg6pLtS9BhQgr-Yueww"
          alt="A lush close-up of fresh organic green vegetables like kale and spinach arranged artfully on a rustic wooden table. The lighting is bright and natural, reflecting a clean and vibrant health-conscious lifestyle."
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-on-primary">
          <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm uppercase mb-2 inline-block">
            Organic Special
          </span>
          <h3 className="font-headline-md text-headline-md mb-1">Seasonal Harvest</h3>
          <p className="font-body-md text-body-md opacity-90">Up to 20% off on fresh greens.</p>
        </div>
      </div>

      {/* Banner 2 */}
      <div className="relative h-64 rounded-xl overflow-hidden group cursor-pointer shadow-md">
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjnIw5RZrXHPd_GKKABXxBRYC-dUj4ANzsISidVpnNWcuysYUBxvAlhb3O-ACU-SojPjwsZWeEhUj_ODGL_0zX8VoQ9xyp9z35PcwjfgFp9V4e6fB37B3R5w0q747pJssMbTcyPaLvpMwT5YWygCG5PHTjpB-sN22i4aSavtb1_YRe-2_qX0Ah1T34IUPlR3gpsb_6cjKnc75Ja_soG3Xu2OQbX0xBeLomBfVxkTGAum-xNO3kJaVS7pCguQfvqBgMZY8odycDMMl7"
          alt="A premium assortment of organic nuts, seeds, and dried fruits presented in minimalist glass jars. The setting is a bright, high-end pantry with soft morning light filtering through."
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-on-primary">
          <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm uppercase mb-2 inline-block">
            Premium Range
          </span>
          <h3 className="font-headline-md text-headline-md mb-1">Bulk Superfoods</h3>
          <p className="font-body-md text-body-md opacity-90">Fuel your body with the best.</p>
        </div>
      </div>
    </div>
  )
}
