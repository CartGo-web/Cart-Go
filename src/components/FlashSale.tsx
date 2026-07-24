import React, { useState, useEffect } from 'react';
import { Zap, Clock, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface FlashSaleProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAllFlashSales: () => void;
}

export const FlashSale: React.FC<FlashSaleProps> = ({
  products,
  onSelectProduct,
  onViewAllFlashSales,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 24, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter((p) => p.isFlashSale || p.originalPrice).slice(0, 4);

  if (flashProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
      {/* Flash Sale Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#F57224] font-black text-lg">
            <Zap className="w-6 h-6 fill-[#F57224] animate-pulse" />
            <span>FLASH SALE</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-[#F57224]" />
            <span>Ends in</span>
            <div className="flex gap-1 ml-1 text-white font-mono font-bold">
              <span className="bg-[#F57224] px-1.5 py-0.5 rounded text-[11px]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="bg-[#F57224] px-1.5 py-0.5 rounded text-[11px]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="bg-[#F57224] px-1.5 py-0.5 rounded text-[11px]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onViewAllFlashSales}
          className="text-xs font-bold text-[#F57224] hover:text-orange-600 flex items-center gap-1 group"
        >
          <span>SHOP MORE DEALS</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Flash Sale Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {flashProducts.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
        ))}
      </div>
    </div>
  );
};
