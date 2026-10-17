import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface CookieBannerProps {
  onOpenTerms: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenTerms }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('au_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('au_cookie_consent', JSON.stringify({ essential: true, analytics: true, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('au_cookie_consent', JSON.stringify({ essential: true, analytics: false, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 text-white shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg mt-0.5 border border-blue-500/30 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white text-sm">
              Aditya University Examination Portal — Privacy & Essential Cookies Notice
            </p>
            <p className="leading-relaxed text-slate-300">
              This university web portal utilizes strictly necessary authentication and session tokens to ensure cryptographic integrity of examination scheduling, attendance registers, and role-based access. No third-party ad tracking is conducted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold px-2 py-1 cursor-pointer"
          >
            Terms & Conduct
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
