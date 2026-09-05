import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  showBadge = true,
  badgeText = 'AI CORE',
  className = '',
}) => {
  // Dimensions based on size prop
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const subtitleSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Impressive Glowing Emblem */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 group cursor-pointer`}>
        {/* Ambient Neon Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
        
        {/* Core Emblem Surface */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-[#0b1329] via-[#0d1b3e] to-[#080d1a] border border-cyan-500/40 p-1.5 flex items-center justify-center shadow-inner overflow-hidden">
          {/* Subtle Cyber Grid Background in Logo */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />
          
          {/* Futuristic Vector Pulse-Shield Icon */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full z-10 filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
          >
            <defs>
              <linearGradient id="pulseGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00F2FE" />
                <stop offset="45%" stopColor="#38BDF8" />
                <stop offset="85%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              <linearGradient id="shieldGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Geometric Shield Base */}
            <path
              d="M16 3L27 7.5V15.5C27 22.5 22.3 27.2 16 29.5C9.7 27.2 5 22.5 5 15.5V7.5L16 3Z"
              fill="url(#shieldGrad)"
              stroke="url(#pulseGrad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* High-Tech Dynamic Pulse & Ascending Arrow */}
            <path
              d="M8.5 16.5H12L14.5 10.5L17.5 22.5L20.5 14L22.5 16.5H24.5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 16.5H12L14.5 10.5L17.5 22.5L20.5 14L22.5 16.5H24.5"
              stroke="url(#pulseGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-75"
            />

            {/* Glowing Recovery Apex Node */}
            <circle cx="17.5" cy="22.5" r="1.5" fill="#38BDF8" />
            <circle cx="14.5" cy="10.5" r="1.6" fill="#00F2FE" className="animate-pulse" />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-black ${titleSizes[size]} tracking-tight flex items-center gap-1.5`}>
            <span className="text-white">Rev</span>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
              Pulse
            </span>
            {showBadge && (
              <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 border border-cyan-500/30 rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                {badgeText}
              </span>
            )}
          </div>
          {showSubtitle && (
            <div className={`font-bold ${subtitleSizes[size]} text-slate-400 tracking-[0.16em] uppercase mt-1`}>
              Autonomous Revenue Engine
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
