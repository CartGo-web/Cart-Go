import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Gift, ShieldCheck, Truck } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    title: 'Cart Go Grand Mega Sale',
    subtitle: 'Up to 70% OFF on Top Tech, Fashion & Home Appliances',
    badge: 'Limited Time Deal',
    buttonText: 'Shop Deals Now',
    bgGradient: 'from-orange-600 via-amber-500 to-red-600',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    title: 'Audio & Gadget Festival',
    subtitle: 'Fast COD Delivery + Extra Discount with Voucher CARTGO20',
    badge: 'Verified Sellers',
    buttonText: 'Explore Headphones',
    bgGradient: 'from-slate-900 via-indigo-900 to-blue-800',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    title: 'New Season Wardrobe',
    subtitle: 'Trending Jackets, Bags & Leather Essentials',
    badge: 'Fashion Week',
    buttonText: 'View Collection',
    bgGradient: 'from-amber-600 via-orange-500 to-rose-600',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
  },
];

export const BannerSlider: React.FC<{ onExploreClick: () => void }> = ({ onExploreClick }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[current];

  return (
    <div className="space-y-4">
      {/* Main Promo Carousel */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-[240px] sm:h-[300px] lg:h-[340px] group">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} transition-all duration-700 opacity-90`}
        />
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute right-0 top-0 bottom-0 w-1/2 object-cover mix-blend-overlay opacity-60 hidden sm:block"
        />

        {/* Content */}
        <div className="relative z-10 h-full max-w-2xl p-6 sm:p-10 flex flex-col justify-center text-white">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-orange-100 uppercase tracking-wider w-fit mb-3">
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            {banner.badge}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {banner.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-100 mt-2 max-w-md">
            {banner.subtitle}
          </p>
          <div className="mt-5">
            <button
              onClick={onExploreClick}
              className="px-6 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-orange-50 hover:text-[#F57224] transition-all shadow-md hover:scale-105 active:scale-95"
            >
              {banner.buttonText}
            </button>
          </div>
        </div>

        {/* Arrow Controls */}
        <button
          onClick={() => setCurrent((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % BANNERS.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                current === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feature Value Props Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#F57224] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Free Delivery</h4>
            <p className="text-[10px] text-slate-500">Orders over $100</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">100% Authentic</h4>
            <p className="text-[10px] text-slate-500">Verified Marketplace</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Daily Flash Sales</h4>
            <p className="text-[10px] text-slate-500">Extra voucher discounts</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Cash on Delivery</h4>
            <p className="text-[10px] text-slate-500">Pay on doorstep delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
};
