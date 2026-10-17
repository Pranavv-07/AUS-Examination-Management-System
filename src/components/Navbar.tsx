import React, { useState } from 'react';
import { AdityaLogo } from './AdityaLogo';
import { db } from '../services/dbStorage';
import { User } from '../types';
import {
  Bell,
  Database,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Building2,
  Calendar,
  Menu,
  X,
  FileText,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  activeModule: string;
  onNavigate: (module: string) => void;
  onLogout: () => void;
  onOpenTerms: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  activeModule,
  onNavigate,
  onLogout,
  onOpenTerms,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const settings = db.getSettings();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro banner with high contrast */}
      <div className="bg-[#002147] text-white text-[11px] px-4 py-1.5 flex justify-between items-center font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-extrabold tracking-wide">
            <Building2 className="w-3.5 h-3.5" />
            OFFICE OF THE CONTROLLER OF EXAMINATIONS
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-200 font-semibold">
            {settings.accreditationText}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-200">
          <span className="hidden sm:inline flex items-center gap-1 font-semibold">
            <Calendar className="w-3 h-3 text-amber-400" />
            Academic Year: 2026–2027
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            MongoDB Atlas Connected
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <AdityaLogo size="md" />
        </div>

        {/* User profile, actions, and quick logout */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenTerms}
            className="hidden lg:flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Terms & Conduct
          </button>

          {/* Quick role badge */}
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}
              >
                {currentUser.role}
              </span>
              <span className="text-[11px] text-slate-600 font-medium">({currentUser.department || 'Exam Cell'})</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer focus:ring-2 focus:ring-blue-600"
              aria-expanded={showUserMenu}
              aria-label="User profile menu"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  currentUser.role === 'ADMIN' ? 'bg-[#002147]' : 'bg-[#EA580C]'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-600" />
            </button>

            {/* Dropdown for role switching & logout */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-600">{currentUser.email}</p>
                </div>

                {/* Profile Information & Direct Actions */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Access Role</span>
                  <span className="text-xs font-bold text-[#002147] block">{currentUser.role === 'ADMIN' ? 'Chief Controller of Examinations (Admin)' : 'Departmental Examiner'}</span>
                  {currentUser.department && (
                    <span className="text-[11px] text-slate-500 block">Assigned Dept: {currentUser.department}</span>
                  )}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1 px-3 space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left py-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-2"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-700" />
                    Portal Settings & DB
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left py-1.5 text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    Sign Out to Login Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
