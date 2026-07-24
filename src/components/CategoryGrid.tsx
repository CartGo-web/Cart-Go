import React from 'react';
import { CATEGORIES } from '../data/categories';
import {
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  ShoppingBag,
  Activity,
  Smile,
} from 'lucide-react';

interface CategoryGridProps {
  onSelectCategory: (categoryId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  Smile: <Smile className="w-5 h-5" />,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
        Explore Categories
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="group flex flex-col items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-orange-50 hover:border-orange-200 transition-all text-center"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${cat.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-2`}
            >
              {ICON_MAP[cat.iconName] || <ShoppingBag className="w-5 h-5" />}
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-[#F57224] line-clamp-2">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
