import React from 'react';
import { db } from '../services/dbStorage';

interface AdityaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  whiteVariant?: boolean;
}

export const AdityaLogo: React.FC<AdityaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  whiteVariant = false,
}) => {
  const settings = db.getSettings();
  const customLogoUrl = settings?.logoUrl;

  const sizeMap = {
    sm: { dimension: 36, textClass: 'text-sm' },
    md: { dimension: 48, textClass: 'text-base' },
    lg: { dimension: 64, textClass: 'text-xl' },
    xl: { dimension: 84, textClass: 'text-2xl' },
  };

  const { dimension } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* If user uploaded or specified custom official logo image, use it directly */}
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt="Aditya University Official Emblem"
          style={{ width: dimension, height: dimension, objectFit: 'contain' }}
          className="flex-shrink-0 drop-shadow-sm rounded-md"
        />
      ) : (
        /* Official High-Resolution Aditya University Emblem Vector */
        <svg
          width={dimension}
          height={dimension}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 drop-shadow-sm"
          role="img"
          aria-label="Aditya University Official Logo"
        >
          <circle cx="50" cy="50" r="48" fill={whiteVariant ? "#ffffff" : "#002147"} stroke="#EA580C" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="44" fill={whiteVariant ? "#002147" : "#002b5c"} />
          
          {/* Sun Rays */}
          <path d="M50 12 L50 20 M50 80 L50 88 M12 50 L20 50 M80 50 L88 50 M23 23 L29 29 M71 71 L77 77 M23 77 L29 71 M71 23 L77 29" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="42" r="14" fill="#F97316" />
          <circle cx="50" cy="42" r="11" fill="#FBBF24" />

          {/* Academic Shield & Book */}
          <path
            d="M34 46 Q50 40 66 46 L66 60 Q50 74 34 60 Z"
            fill="#FFFFFF"
            stroke="#002147"
            strokeWidth="1.5"
          />
          
          {/* Open Book of Knowledge */}
          <path
            d="M38 52 C44 50 49 53 50 55 C51 53 56 50 62 52 L62 61 C56 59 51 62 50 64 C49 62 44 59 38 61 Z"
            fill="#002147"
          />
          <line x1="50" y1="55" x2="50" y2="64" stroke="#FFFFFF" strokeWidth="1" />

          {/* University Ribbons & Laurels */}
          <path
            d="M26 72 Q50 83 74 72 L71 76 Q50 87 29 76 Z"
            fill="#EA580C"
          />

          <text
            x="50"
            y="32"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="7"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
            letterSpacing="1"
          >
            ADITYA
          </text>
        </svg>
      )}

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none uppercase font-heading ${
                whiteVariant ? 'text-white' : 'text-[#002147]'
              } ${size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg'}`}
            >
              ADITYA
            </span>
            <span
              className={`font-bold tracking-wider leading-none uppercase text-[#EA580C] ${
                size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-base'
              }`}
            >
              UNIVERSITY
            </span>
          </div>
          <span
            className={`text-[10px] tracking-widest font-semibold uppercase ${
              whiteVariant ? 'text-blue-200' : 'text-slate-600'
            }`}
          >
            Surampalem • Examination Portal
          </span>
        </div>
      )}
    </div>
  );
};

// Generates an offscreen Canvas data URL of the emblem for jsPDF document rendering
export function getAdityaLogoDataUrl(): string {
  const settings = db.getSettings();
  if (settings?.logoUrl && settings.logoUrl.startsWith('data:image')) {
    return settings.logoUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background circle
  ctx.beginPath();
  ctx.arc(80, 80, 76, 0, 2 * Math.PI);
  ctx.fillStyle = '#002147';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#EA580C';
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(80, 80, 68, 0, 2 * Math.PI);
  ctx.fillStyle = '#002b5c';
  ctx.fill();

  // Sun
  ctx.beginPath();
  ctx.arc(80, 68, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();

  // Shield
  ctx.beginPath();
  ctx.moveTo(54, 75);
  ctx.quadraticCurveTo(80, 66, 106, 75);
  ctx.lineTo(106, 96);
  ctx.quadraticCurveTo(80, 118, 54, 96);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#002147';
  ctx.stroke();

  // Book
  ctx.beginPath();
  ctx.moveTo(60, 84);
  ctx.quadraticCurveTo(70, 81, 80, 88);
  ctx.quadraticCurveTo(90, 81, 100, 84);
  ctx.lineTo(100, 98);
  ctx.quadraticCurveTo(90, 95, 80, 102);
  ctx.quadraticCurveTo(70, 95, 60, 98);
  ctx.closePath();
  ctx.fillStyle = '#002147';
  ctx.fill();

  // Ribbon
  ctx.beginPath();
  ctx.moveTo(42, 115);
  ctx.quadraticCurveTo(80, 132, 118, 115);
  ctx.lineTo(113, 122);
  ctx.quadraticCurveTo(80, 139, 47, 122);
  ctx.closePath();
  ctx.fillStyle = '#EA580C';
  ctx.fill();

  // Text
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('ADITYA', 80, 52);

  return canvas.toDataURL('image/png');
}
