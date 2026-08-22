import React, { useState, useEffect, useId } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
  X,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Star,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

export interface PriceFilterState {
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  freeDeliveryOnly: boolean;
  minRating: number | null;
}

interface PriceFilterBarProps {
  absoluteMin: number;
  absoluteMax: number;
  filterState: PriceFilterState;
  onFilterChange: (newState: PriceFilterState) => void;
  totalMatching: number;
  totalProducts: number;
}

export const PriceFilterBar: React.FC<PriceFilterBarProps> = ({
  absoluteMin,
  absoluteMax,
  filterState,
  onFilterChange,
  totalMatching,
  totalProducts,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [tempMin, setTempMin] = useState<string>(
    filterState.minPrice !== null ? String(filterState.minPrice) : ''
  );
  const [tempMax, setTempMax] = useState<string>(
    filterState.maxPrice !== null ? String(filterState.maxPrice) : ''
  );

  // Synchronize internal inputs when external filterState changes
  useEffect(() => {
    setTempMin(filterState.minPrice !== null ? String(filterState.minPrice) : '');
    setTempMax(filterState.maxPrice !== null ? String(filterState.maxPrice) : '');
  }, [filterState.minPrice, filterState.maxPrice]);

  // Effective min & max for slider
  const sliderMin = absoluteMin;
  const sliderMax = Math.max(absoluteMax, absoluteMin + 100);

  const currentMin = filterState.minPrice !== null ? filterState.minPrice : sliderMin;
  const currentMax = filterState.maxPrice !== null ? filterState.maxPrice : sliderMax;

  // Handle slider changes
  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), currentMax);
    onFilterChange({
      ...filterState,
      minPrice: val === sliderMin ? null : val,
    });
  };

  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), currentMin);
    onFilterChange({
      ...filterState,
      maxPrice: val === sliderMax ? null : val,
    });
  };

  // Handle manual input apply
  const handleApplyInputs = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedMin = tempMin.trim() !== '' ? Math.max(0, Number(tempMin)) : null;
    const parsedMax = tempMax.trim() !== '' ? Math.max(0, Number(tempMax)) : null;

    let finalMin = parsedMin;
    let finalMax = parsedMax;

    if (finalMin !== null && finalMax !== null && finalMin > finalMax) {
      // Swap if user typed min > max
      const temp = finalMin;
      finalMin = finalMax;
      finalMax = temp;
      setTempMin(String(finalMin));
      setTempMax(String(finalMax));
    }

    onFilterChange({
      ...filterState,
      minPrice: finalMin,
      maxPrice: finalMax,
    });
  };

  // Quick preset ranges
  const presets = [
    { label: 'Under Rs. 1,000', min: null, max: 1000 },
    { label: 'Rs. 1k – 5k', min: 1000, max: 5000 },
    { label: 'Rs. 5k – 15k', min: 5000, max: 15000 },
    { label: 'Rs. 15k – 50k', min: 15000, max: 50000 },
    { label: 'Rs. 50,000+', min: 50000, max: null },
  ];

  const isPresetActive = (min: number | null, max: number | null) => {
    return filterState.minPrice === min && filterState.maxPrice === max;
  };

  const handleSelectPreset = (min: number | null, max: number | null) => {
    if (isPresetActive(min, max)) {
      // Toggle off
      onFilterChange({
        ...filterState,
        minPrice: null,
        maxPrice: null,
      });
    } else {
      onFilterChange({
        ...filterState,
        minPrice: min,
        maxPrice: max,
      });
    }
  };

  const handleResetAllFilters = () => {
    setTempMin('');
    setTempMax('');
    onFilterChange({
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      freeDeliveryOnly: false,
      minRating: null,
    });
  };

  const hasActiveFilters =
    filterState.minPrice !== null ||
    filterState.maxPrice !== null ||
    filterState.inStockOnly ||
    filterState.freeDeliveryOnly ||
    filterState.minRating !== null;

  // Percentage calculations for dual slider track
  const minPercent = Math.max(0, Math.min(100, ((currentMin - sliderMin) / (sliderMax - sliderMin)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((currentMax - sliderMin) / (sliderMax - sliderMin)) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white shadow-xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold tracking-wide text-white">
                Price Discovery & Filters
              </h3>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-[#FF5500] text-white text-[10px] font-black rounded-full shadow-xs animate-pulse">
                  Filter Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Showing <strong className="text-orange-400 font-bold">{totalMatching}</strong> of {totalProducts} items in catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all price and discovery filters"
            >
              <RotateCcw className="w-3 h-3 text-orange-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle price filter panel"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Filter Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 bg-white">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Min/Max Inputs & Dual Slider (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Range Slider Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Price Range Slider:</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-[#FF5500] bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                    {formatPKR(currentMin)} — {formatPKR(currentMax)}
                  </span>
                </div>

                {/* Dual Slider Track Container */}
                <div className="relative pt-3 pb-2 px-1">
                  {/* Background Track */}
                  <div className="h-2 bg-slate-200 rounded-full relative">
                    {/* Active Range Highlight */}
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-[#FF9900] to-[#FF5500] rounded-full"
                      style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(0, maxPercent - minPercent)}%`,
                      }}
                    />
                  </div>

                  {/* Range Input 1 (Min Slider) */}
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={Math.max(1, Math.round((sliderMax - sliderMin) / 100))}
                    value={currentMin}
                    onChange={handleSliderMinChange}
                    className="absolute top-2 left-0 w-full appearance-none bg-transparent pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FF5500] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FF5500] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                  />

                  {/* Range Input 2 (Max Slider) */}
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={Math.max(1, Math.round((sliderMax - sliderMin) / 100))}
                    value={currentMax}
                    onChange={handleSliderMaxChange}
                    className="absolute top-2 left-0 w-full appearance-none bg-transparent pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FF5500] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FF5500] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
                    <span>{formatPKR(sliderMin)}</span>
                    <span className="text-slate-400">Drag thumbs to adjust</span>
                    <span>{formatPKR(sliderMax)}</span>
                  </div>
                </div>
              </div>

              {/* Min & Max Numeric Input Form */}
              <form onSubmit={handleApplyInputs} className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Min Input */}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Min Price (Rs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        placeholder={String(sliderMin)}
                        value={tempMin}
                        onChange={(e) => setTempMin(e.target.value)}
                        className="w-full pl-9 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                      />
                    </div>
                  </div>

                  <span className="text-slate-400 font-bold text-xs mt-5">—</span>

                  {/* Max Input */}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Max Price (Rs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        placeholder={String(sliderMax)}
                        value={tempMax}
                        onChange={(e) => setTempMax(e.target.value)}
                        className="w-full pl-9 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    type="submit"
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Quick Presets & Discovery Toggles (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-slate-100 lg:pl-5">
              {/* Quick Preset Range Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-2">
                  Quick Price Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, idx) => {
                    const active = isPresetActive(p.min, p.max);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(p.min, p.max)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                            : 'bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-[#FF5500] border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra Discovery Filter Toggles */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-2">
                  Product Availability & Perks
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* In Stock Only Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filterState,
                        inStockOnly: !filterState.inStockOnly,
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      filterState.inStockOnly
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>In Stock Only</span>
                    </div>
                    {filterState.inStockOnly && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>

                  {/* Free Delivery Only Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filterState,
                        freeDeliveryOnly: !filterState.freeDeliveryOnly,
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      filterState.freeDeliveryOnly
                        ? 'bg-orange-50 border-orange-300 text-orange-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>Free Delivery</span>
                    </div>
                    {filterState.freeDeliveryOnly && (
                      <Check className="w-3.5 h-3.5 text-[#FF5500]" />
                    )}
                  </button>

                  {/* 4+ Star Rating Filter */}
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filterState,
                        minRating: filterState.minRating === 4 ? null : 4,
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer col-span-1 sm:col-span-2 ${
                      filterState.minRating === 4
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Top Rated (4★ & Above)</span>
                    </div>
                    {filterState.minRating === 4 && (
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-500 text-[11px]">Active Filters:</span>

              {filterState.minPrice !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg font-bold text-[11px]">
                  <span>Min: {formatPKR(filterState.minPrice)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filterState, minPrice: null })
                    }
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterState.maxPrice !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg font-bold text-[11px]">
                  <span>Max: {formatPKR(filterState.maxPrice)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filterState, maxPrice: null })
                    }
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterState.inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px]">
                  <span>In Stock Only</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filterState, inStockOnly: false })
                    }
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterState.freeDeliveryOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg font-bold text-[11px]">
                  <span>Free Delivery</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filterState, freeDeliveryOnly: false })
                    }
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterState.minRating !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px]">
                  <span>4★ & Above</span>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filterState, minRating: null })
                    }
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
