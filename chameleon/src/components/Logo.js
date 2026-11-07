import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ModeContext } from '../context/ModeContext';

/**
 * Enterprise Brand Logo Component
 * Provides an authoritative cybersecurity identity with an engineered geometric emblem,
 * crisp letter-spaced typography, and dynamic mode accenting (Crimson for Security, Cobalt for User).
 */
const Logo = ({ className = '', size = 28, href = '/' }) => {
  const { mode } = useContext(ModeContext);
  const isSecurity = mode === 'security';

  const accentColor = isSecurity ? '#e11d48' : '#3b82f6';
  const glowShadow = isSecurity
    ? 'drop-shadow(0 0 10px rgba(225, 29, 72, 0.45))'
    : 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.45))';

  const content = (
    <div className={`group inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Engineered Geometric Emblem */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 40 40"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: glowShadow }}
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="emblemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={isSecurity ? '#9f1239' : '#1d4ed8'} />
            </linearGradient>
            <linearGradient id="shieldFrame" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Hexagonal Shield Perimeter */}
          <polygon
            points="20,2 36,11 36,29 20,38 4,29 4,11"
            fill="#090d16"
            stroke="url(#shieldFrame)"
            strokeWidth="1.5"
          />

          {/* Dynamic Core Geometry */}
          <path
            d="M20 9L30 15V25L20 31L10 25V15L20 9Z"
            fill="none"
            stroke="url(#emblemGradient)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Central Security Nexus */}
          <circle cx="20" cy="20" r="3.5" fill={accentColor} />
          <path
            d="M20 12V16M20 24V28M13 16.5L16.5 18.5M23.5 21.5L27 23.5M13 23.5L16.5 21.5M23.5 18.5L27 16.5"
            stroke={accentColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Enterprise Wordmark */}
      <div className="flex items-center tracking-[0.16em] font-bold text-white transition-colors duration-300">
        <span className="text-base tracking-[0.16em] uppercase">PIICASSO</span>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full ml-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link to={href} className="inline-flex text-inherit no-underline">
      {content}
    </Link>
  );
};

export default Logo;
