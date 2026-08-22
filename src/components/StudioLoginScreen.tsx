import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Camera, LogIn, ArrowRight } from 'lucide-react';

interface StudioLoginScreenProps {
  expectedUsername: string;
  expectedPassword: string;
  onLoginSuccess: (rememberDevice: boolean) => void;
  studioName?: string;
  studioTagline?: string;
  logoUrl?: string;
}

export const StudioLoginScreen: React.FC<StudioLoginScreenProps> = ({
  expectedUsername,
  expectedPassword,
  onLoginSuccess,
  studioName = 'FUSION BELLS FILMS',
  studioTagline = 'REAL MOMENTS, TIMELESS STORIES.',
  logoUrl,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remember, setRemember] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const expUser = (expectedUsername || 'fusionbells').trim().toLowerCase();
    const expPass = expectedPassword || 'fbf@2026';

    if (cleanUser === expUser && password === expPass) {
      setError(false);
      onLoginSuccess(remember);
    } else {
      setError(true);
      setErrorMessage('Invalid studio username or password.');
      setTimeout(() => setError(false), 2500);
    }
  };

  const handleFillDemo = () => {
    setUsername(expectedUsername || 'fusionbells');
    setPassword(expectedPassword || 'fbf@2026');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Decorative Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px] animate-pulse"></div>
      </div>

      <div
        className={`w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border ${
          error ? 'border-red-500/60 animate-shake' : 'border-amber-500/30'
        } rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-left transition-all`}
      >
        {/* Studio Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={studioName}
              className="max-h-16 max-w-[240px] object-contain mb-3"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-xl mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Camera className="w-7 h-7 text-amber-400" />
              </div>
            </div>
          )}
          <h1 className="text-xl font-bold text-amber-100 tracking-wide font-['Outfit']">
            {studioName}
          </h1>
          <p className="text-[10.5px] tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            {studioTagline}
          </p>
        </div>

        {/* Security Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center space-x-2 text-amber-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider font-['Outfit']">
              Studio Portal Login
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Private Access</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Studio Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. fusionbells"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Studio Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Remember Device Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
              />
              <span>Remember me (30 Days)</span>
            </label>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Auto-Fill Default
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 mt-4"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Studio Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Encrypted Session</span>
          </span>
          <div className="text-[10.5px] text-slate-400 text-center sm:text-right">
            <span>Default: </span>
            <code className="text-amber-300">fusionbells</code> / <code className="text-amber-300">fbf@2026</code>
          </div>
        </div>
      </div>
    </div>
  );
};
