import React from "react";

export interface GlassIconProps {
  className?: string;
  isLoading?: boolean;
}

export const PrintGlassIcon = ({ className, isLoading }: GlassIconProps) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <defs>
      <filter id="pr-glow"><feGaussianBlur stdDeviation="8" /></filter>
      <linearGradient id="pr-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="pr-border" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    {/* Printer body shadow */}
    <ellipse cx="50" cy="55" rx="35" ry="20" fill="#0ea5e9" filter="url(#pr-glow)" opacity="0.6" />
    {/* Print base shape */}
    <rect x="15" y="45" width="70" height="30" rx="8" fill="#0284c7" />
    <path d="M15 55 L85 55" stroke="#38bdf8" strokeWidth="3" opacity="0.4" />
    {/* Glass paper popping out */}
    <rect x="25" y="15" width="50" height="45" rx="6" fill="url(#pr-glass)" stroke="url(#pr-border)" strokeWidth="1.5" />
    {/* Paper lines */}
    <rect x="35" y="28" width={isLoading ? "0" : "30"} height="4" rx="2" fill="#ffffff" opacity="0.8">
      {isLoading && <animate attributeName="width" values="10;30;10" dur="1s" repeatCount="indefinite" />}
    </rect>
    <rect x="35" y="38" width={isLoading ? "20" : "20"} height="4" rx="2" fill="#ffffff" opacity="0.5">
      {isLoading && <animate attributeName="width" values="20;10;20" dur="1s" repeatCount="indefinite" />}
    </rect>
  </svg>
);

export const JsonGlassIcon = ({ className, isLoading }: GlassIconProps) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <defs>
      <filter id="js-glow"><feGaussianBlur stdDeviation="10" /></filter>
      <linearGradient id="js-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="js-border" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="25" y="20" width="50" height="50" rx="12" fill="#f59e0b" filter="url(#js-glow)" opacity="0.6" />
    <rect x="30" y="25" width="45" height="45" rx="10" fill="#d97706" />
    <rect x="15" y="15" width="55" height="55" rx="12" fill="url(#js-glass)" stroke="url(#js-border)" strokeWidth="1.5" />
    <text x="42.5" y="52" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="monospace" textAnchor="middle">
      {`{`}
      {isLoading && <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />}
    </text>
    <text x="58" y="52" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="monospace" textAnchor="middle" opacity="0.4">
      {`}`}
      {isLoading && <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />}
    </text>
    <text x="42.5" y="64" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" opacity="0.9">JSON</text>
  </svg>
);
