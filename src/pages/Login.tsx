import React, { useState } from 'react';
import { db } from '../services/dbStorage';
import { User } from '../types';
import { AdityaLogo } from '../components/AdityaLogo';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onOpenTerms: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenTerms }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form field-level validation errors
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Human Verification (Formal arithmetic verification)
  const [num1, setNum1] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [num2, setNum2] = useState(() => Math.floor(Math.random() * 7) + 1);
  const [humanAnswer, setHumanAnswer] = useState('');
  const [humanAnswerError, setHumanAnswerError] = useState('');

  const refreshVerification = () => {
    setNum1(Math.floor(Math.random() * 8) + 2);
    setNum2(Math.floor(Math.random() * 7) + 1);
    setHumanAnswer('');
    setHumanAnswerError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setGeneralError('');
    setHumanAnswerError('');

    let hasError = false;

    if (!username.trim()) {
      setUsernameError('Please enter your authorized username.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }

    // Formal human calculation verification
    if (!humanAnswer || parseInt(humanAnswer, 10) !== num1 + num2) {
      setHumanAnswerError('Please enter the correct answer to confirm you are human.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    setTimeout(() => {
      const res = db.login(username, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setGeneralError(res.error || 'Invalid credentials. Please verify your username and password.');
        refreshVerification();
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-[#030d1a] relative flex flex-col justify-between items-center px-4 py-8 antialiased selection:bg-orange-500 selection:text-white overflow-y-auto">
      {/* Dynamic Background Accents & Subtle Academic Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top University Branding Anchor */}
      <div className="relative z-10 w-full max-w-md pt-4 flex flex-col items-center text-center animate-in fade-in duration-300">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-md mb-3">
          <AdityaLogo size="xl" showText={false} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading uppercase drop-shadow-xs">
          ADITYA UNIVERSITY
        </h1>
        <p className="text-[11px] sm:text-xs font-bold text-[#EA580C] uppercase tracking-wider mt-1">
          Examination Section • Surampalem Campus
        </p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 max-w-xs">
          Autonomous Examination, Hall Allocation & Attendance Portal
        </p>
      </div>

      {/* Main Login Card - Refined, Dynamic, Professional */}
      <div className="relative z-10 w-full max-w-md my-6 animate-in zoom-in-95 duration-400">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 space-y-5">
          {/* Section Heading */}
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Sign In to Portal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized institutional access for examination conduct
              </p>
            </div>
            <span className="p-2 rounded-lg bg-orange-50 text-[#EA580C]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-username"
                  className="text-xs font-bold text-slate-700"
                >
                  Username
                </label>
                {usernameError && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {usernameError}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError('');
                    if (generalError) setGeneralError('');
                  }}
                  placeholder="Enter username"
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    usernameError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#002147] focus:ring-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-slate-700"
                >
                  Password
                </label>
                {passwordError && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (generalError) setGeneralError('');
                  }}
                  placeholder="Enter password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50/80 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    passwordError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#002147] focus:ring-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Human Verification (Clean, Formal, No-nonsense) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-human-check"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Security Check: Are you human?</span>
                </label>
                {humanAnswerError && (
                  <span className="text-[11px] font-semibold text-rose-600">
                    {humanAnswerError}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 tracking-wider select-none flex-shrink-0">
                  {num1} + {num2} = ?
                </div>
                <input
                  id="login-human-check"
                  type="number"
                  placeholder="Result"
                  value={humanAnswer}
                  onChange={e => {
                    setHumanAnswer(e.target.value);
                    if (humanAnswerError) setHumanAnswerError('');
                  }}
                  className={`flex-1 px-3 py-2.5 bg-slate-50/80 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    humanAnswerError
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-[#002147] focus:ring-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={refreshVerification}
                  className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-slate-200"
                  title="Generate new calculation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#002147] focus:ring-[#002147] cursor-pointer"
                />
                <span className="font-medium">Keep session active</span>
              </label>

              <button
                type="button"
                onClick={onOpenTerms}
                className="text-slate-600 hover:text-slate-900 font-medium underline underline-offset-2 cursor-pointer transition"
              >
                Terms & Guidelines
              </button>
            </div>

            {/* Clear Call to Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#c2410c] active:bg-[#9a3412] focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Examination Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Refined Institutional Footer */}
      <footer className="relative z-10 text-center text-[11px] text-slate-400 py-3">
        <p>© 2026 Aditya University • Office of the Controller of Examinations</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          ADB Road, Surampalem, Kakinada District, Andhra Pradesh - 533437
        </p>
      </footer>
    </div>
  );
};
