import React from 'react';
import { AdityaLogo } from '../components/AdityaLogo';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

interface NotFoundPageProps {
  onReturnHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnHome }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
        <div className="flex justify-center mb-1">
          <AdityaLogo size="md" showText={false} />
        </div>
        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
          Error 404 • Resource Not Found
        </div>
        <h2 className="text-2xl font-black text-[#002147] font-heading">
          Page or Examination Record Unavailable
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested examination URL, hall layout, or document identifier could not be located in the Aditya University database. It may have been archived, renamed, or restricted.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#002147] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>

        <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-100">
          Need assistance? Contact Aditya University Examination Cell: <span className="font-semibold text-slate-600">coe@adityauniversity.in</span>
        </p>
      </div>
    </div>
  );
};
