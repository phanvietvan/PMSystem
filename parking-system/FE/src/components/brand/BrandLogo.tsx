import React from 'react';
import { Link } from 'react-router-dom';

const APP_NAME = 'PM System';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  showTagline?: boolean;
  tagline?: string;
  asLink?: boolean;
  to?: string;
  className?: string;
  textClassName?: string;
}

const sizeMap: Record<
  BrandLogoSize,
  { icon: string; title: string; tagline: string; gap: string }
> = {
  xs: { icon: 'w-7 h-7', title: 'text-sm', tagline: 'text-[9px]', gap: 'gap-2' },
  sm: { icon: 'w-9 h-9', title: 'text-lg', tagline: 'text-[10px]', gap: 'gap-2.5' },
  md: { icon: 'w-10 h-10', title: 'text-xl', tagline: 'text-[10px]', gap: 'gap-3' },
  lg: { icon: 'w-12 h-12', title: 'text-2xl', tagline: 'text-xs', gap: 'gap-3' },
};

const StarShape = () => (
  <path
    d="M0 -4.2 L1 -1.1 L4.2 0 L1 1.1 L0 4.2 L-1 1.1 L-4.2 0 L-1 -1.1 Z"
    fill="white"
  />
);

/** White star with SVG twinkle — works reliably inside <svg> */
const TwinkleStar: React.FC<{ delay: string; className?: string }> = ({ delay, className }) => (
  <g className={className}>
    <StarShape />
    <animate
      attributeName="opacity"
      values="0.55;1;0.65;1;0.55"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="1.3s"
      begin={delay}
      repeatCount="indefinite"
    />
    <animateTransform
      attributeName="transform"
      type="scale"
      values="0.6;1.45;0.75;1.3;0.6"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="1.3s"
      begin={delay}
      repeatCount="indefinite"
    />
  </g>
);

export const BrandIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  const uid = React.useId().replace(/:/g, '');
  const bgGrad = `pmBg-${uid}`;
  const glowGrad = `pmGlow-${uid}`;

  return (
    <div className={`brand-p-icon relative shrink-0 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_6px_18px_rgba(0,80,203,0.4)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={bgGrad} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0A3D9E" />
            <stop offset="0.45" stopColor="#0066FF" />
            <stop offset="1" stopColor="#5B4FFF" />
          </linearGradient>
          <radialGradient id={glowGrad} cx="50%" cy="35%" r="55%">
            <stop stopColor="white" stopOpacity="0.28" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id={`pmSoft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#003080" floodOpacity="0.35" />
          </filter>
          <filter id={`pmStarGlow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="48" height="48" rx="14" fill={`url(#${bgGrad})`} />
        <rect width="48" height="48" rx="14" fill={`url(#${glowGrad})`} />

        {/* Letter P */}
        <text
          x="24"
          y="33"
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          filter={`url(#pmSoft-${uid})`}
        >
          P
        </text>

        {/* Twinkling white stars */}
        <g transform="translate(37 9)" filter={`url(#pmStarGlow-${uid})`}>
          <TwinkleStar delay="0s" />
        </g>
        <g transform="translate(9 7)" filter={`url(#pmStarGlow-${uid})`}>
          <TwinkleStar delay="0.26s" />
        </g>
        <g transform="translate(35 33) scale(0.9)" filter={`url(#pmStarGlow-${uid})`}>
          <TwinkleStar delay="0.52s" />
        </g>
        <g transform="translate(7 31) scale(0.78)" filter={`url(#pmStarGlow-${uid})`}>
          <TwinkleStar delay="0.78s" />
        </g>
        <g transform="translate(40 24) scale(0.65)" filter={`url(#pmStarGlow-${uid})`}>
          <TwinkleStar delay="1.04s" />
        </g>
      </svg>
    </div>
  );
};

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = 'Parking Management',
  asLink = false,
  to = '/',
  className = '',
  textClassName = '',
}) => {
  const s = sizeMap[size];

  const content = (
    <div className={`flex items-center ${s.gap} group ${className}`}>
      <div className="transition-transform duration-300 group-hover:scale-105">
        <BrandIcon className={s.icon} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-slate-900 ${s.title} ${textClassName}`}
          >
            {APP_NAME}
          </span>
          {showTagline && (
            <span className={`${s.tagline} font-semibold text-slate-400 tracking-wide mt-0.5`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
export { APP_NAME };
