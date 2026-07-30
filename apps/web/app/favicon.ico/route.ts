import { NextResponse } from "next/server";

export async function GET() {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="50%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#07090E" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="128" height="128" rx="32" fill="#07090E" />
  <rect width="124" height="124" x="2" y="2" rx="30" fill="none" stroke="url(#emeraldGrad)" stroke-opacity="0.4" stroke-width="2" />
  <circle cx="64" cy="64" r="56" fill="url(#glow)" />

  <path d="M 46 42 L 28 64 L 46 86" fill="none" stroke="url(#emeraldGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 82 42 L 100 64 L 82 86" fill="none" stroke="url(#emeraldGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />

  <circle cx="64" cy="64" r="10" fill="#10B981" />
  <circle cx="64" cy="64" r="5" fill="#FFFFFF" />

  <line x1="64" y1="36" x2="64" y2="54" stroke="#06B6D4" stroke-width="4" stroke-dasharray="2 2" stroke-linecap="round" />
  <line x1="64" y1="74" x2="64" y2="92" stroke="#06B6D4" stroke-width="4" stroke-dasharray="2 2" stroke-linecap="round" />
  <circle cx="64" cy="32" r="4" fill="#06B6D4" />
  <circle cx="64" cy="96" r="4" fill="#06B6D4" />
</svg>`;

  return new NextResponse(svgContent, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
