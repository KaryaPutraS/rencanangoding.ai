"use client";

import React from "react";

interface BrandLogoProps {
  variant?: "option1_emerald" | "option2_hexagon" | "option3_monogram";
  size?: number;
  showText?: boolean;
  className?: string;
}

export function BrandLogo({
  variant = "option1_emerald",
  size = 32,
  showText = true,
  className = ""
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Option 1: Emerald Code Bracket Mindmap Node */}
      {variant === "option1_emerald" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="logoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#07090E" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="128" height="128" rx="32" fill="#07090E" />
          <rect width="124" height="124" x="2" y="2" rx="30" fill="none" stroke="url(#logoEmeraldGrad)" strokeOpacity="0.4" strokeWidth="2" />
          <circle cx="64" cy="64" r="56" fill="url(#logoGlow)" />

          <path d="M 46 42 L 28 64 L 46 86" fill="none" stroke="url(#logoEmeraldGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 82 42 L 100 64 L 82 86" fill="none" stroke="url(#logoEmeraldGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

          <circle cx="64" cy="64" r="10" fill="#10B981" />
          <circle cx="64" cy="64" r="5" fill="#FFFFFF" />

          <line x1="64" y1="36" x2="64" y2="54" stroke="#06B6D4" strokeWidth="4" strokeDasharray="3 3" strokeLinecap="round" />
          <line x1="64" y1="74" x2="64" y2="92" stroke="#06B6D4" strokeWidth="4" strokeDasharray="3 3" strokeLinecap="round" />
          <circle cx="64" cy="32" r="4" fill="#06B6D4" />
          <circle cx="64" cy="96" r="4" fill="#06B6D4" />
        </svg>
      )}

      {/* Option 2: Obsidian Hexagon AI Engine */}
      {variant === "option2_hexagon" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <polygon points="64,12 112,38 112,90 64,116 16,90 16,38" fill="#0D131F" stroke="url(#hexGrad)" strokeWidth="4" />
          <polygon points="64,24 100,44 100,84 64,104 28,84 28,44" fill="none" stroke="#10B981" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M 44 48 L 32 64 L 44 80" fill="none" stroke="#06B6D4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 84 48 L 96 64 L 84 80" fill="none" stroke="#06B6D4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="72" y1="44" x2="56" y2="84" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
        </svg>
      )}

      {/* Option 3: Circuit Blueprint Monogram R */}
      {variant === "option3_monogram" && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="monoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          <rect width="128" height="128" rx="28" fill="#0E1524" stroke="#10B981" strokeOpacity="0.4" strokeWidth="2" />
          {/* Monogram R */}
          <path d="M 40 32 L 40 96 M 40 32 L 76 32 C 90 32 90 60 76 60 L 40 60 M 64 60 L 88 96" fill="none" stroke="url(#monoGrad)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="88" cy="96" r="5" fill="#06B6D4" />
          <circle cx="76" cy="32" r="4" fill="#34D399" />
        </svg>
      )}

      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-0.5">
            RencanaNgoding<span className="text-emerald-400 font-mono font-bold">.ai</span>
          </span>
        </div>
      )}
    </div>
  );
}
