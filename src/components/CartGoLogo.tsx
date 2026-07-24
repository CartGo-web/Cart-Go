import React from 'react';

interface CartGoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'color';
  showTagline?: boolean;
}

export const CartGoLogo: React.FC<CartGoLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showTagline = true,
}) => {
  // Height map based on size
  const heightClass =
    size === 'sm'
      ? 'h-8'
      : size === 'md'
      ? 'h-10'
      : size === 'lg'
      ? 'h-14'
      : 'h-20';

  const textColorClass = variant === 'light' ? 'text-slate-900' : 'text-white';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Icon Graphic */}
      <div className={`relative ${heightClass} aspect-square flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="cartOrangeGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" />
              <stop offset="60%" stopColor="#FF5500" />
              <stop offset="100%" stopColor="#E03000" />
            </linearGradient>
            <linearGradient id="textOrangeGradComp" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9900" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
          </defs>

          {/* Speed streaks behind cart */}
          <g fill="url(#cartOrangeGradComp)">
            <rect x="2" y="32" width="16" height="3" rx="1.5" opacity="0.9" />
            <rect x="8" y="42" width="12" height="3" rx="1.5" opacity="0.9" />
            <rect x="2" y="52" width="18" height="3" rx="1.5" opacity="0.9" />
            <rect x="10" y="62" width="10" height="3" rx="1.5" opacity="0.8" />
          </g>

          {/* Shopping Cart Outer & Bowl */}
          <path
            d="M 22 25 C 28 25, 32 28, 34 35 L 76 35 C 84 35, 82 70, 58 70 C 42 70, 36 58, 38 42 L 32 30 L 22 30 Z"
            fill="url(#cartOrangeGradComp)"
          />

          {/* White 'G' inside cart */}
          <path
            d="M 68 45 L 53 45 C 47 45, 45 48, 45 54 C 45 60, 47 63, 53 63 L 66 63 C 70 63, 71 60, 71 56 L 59 56 L 59 52 L 73 52 C 74 52, 75 54, 75 56 C 75 65, 68 67, 53 67 C 42 67, 39 61, 39 54 C 39 47, 43 41, 54 41 L 68 41 Z"
            fill="#FFFFFF"
          />

          {/* Cart Wheels */}
          <circle cx="43" cy="78" r="6" fill="url(#cartOrangeGradComp)" />
          <circle cx="43" cy="78" r="2.5" fill="#1E293B" />

          <circle cx="64" cy="78" r="6" fill="url(#cartOrangeGradComp)" />
          <circle cx="64" cy="78" r="2.5" fill="#1E293B" />
        </svg>
      </div>

      {/* Typography Text */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1 font-black tracking-wider text-lg sm:text-xl md:text-2xl font-sans">
          <span className={textColorClass}>CART</span>
          <span className="bg-gradient-to-r from-[#FF9900] via-[#FF5500] to-[#E03000] bg-clip-text text-transparent flex items-center">
            GO
            <span className="inline-flex flex-col gap-[2px] ml-0.5">
              <span className="w-2 h-[2px] bg-[#FF5500] rounded-full"></span>
              <span className="w-1.5 h-[2px] bg-[#FF5500] rounded-full"></span>
            </span>
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-[#FF9900] tracking-widest uppercase mt-0.5 whitespace-nowrap">
            <span className="w-2.5 h-[1px] bg-[#FF9900]/60"></span>
            <span>SHOP MORE, GET MORE</span>
            <span className="w-2.5 h-[1px] bg-[#FF9900]/60"></span>
          </div>
        )}
      </div>
    </div>
  );
};
