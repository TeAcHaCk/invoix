import React, { useState } from 'react';
import { Lock, ShieldCheck, Camera, ArrowRight } from 'lucide-react';

interface PinLockScreenProps {
  expectedPin: string;
  onUnlock: (rememberDevice: boolean) => void;
  studioName?: string;
  studioTagline?: string;
  logoUrl?: string;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  expectedPin,
  onUnlock,
  studioName = 'FUSION BELLS FILMS',
  studioTagline = 'REAL MOMENTS, TIMELESS STORIES.',
  logoUrl,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      setError(false);

      if (next === expectedPin) {
        onUnlock(remember);
      } else if (next.length === expectedPin.length && next !== expectedPin) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin) {
      onUnlock(remember);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] animate-pulse"></div>
      </div>

      <div
        className={`w-full max-w-md bg-slate-900/90 backdrop-blur-xl border ${
          error ? 'border-red-500/60 animate-shake' : 'border-amber-500/30'
        } rounded-3xl p-8 shadow-2xl relative z-10 text-center transition-all`}
      >
        {/* Studio Branding */}
        <div className="flex flex-col items-center mb-6">
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
          <p className="text-[11px] tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            {studioTagline}
          </p>
        </div>

        {/* Lock Icon & Title */}
        <div className="flex items-center justify-center space-x-2 text-amber-400 mb-2">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider font-['Outfit']">
            Studio Security Gate
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Enter your Studio Passcode to access quotations & invoices.
        </p>

        {/* PIN Input Dots */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="flex justify-center space-x-3.5 mb-2">
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    error
                      ? 'border-red-500 bg-red-500/40'
                      : filled
                      ? 'border-amber-400 bg-amber-400 shadow-md shadow-amber-400/40 scale-110'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-400 animate-fadeIn">
              Incorrect Studio Passcode. Please try again.
            </p>
          )}

          {/* Numeric Keypad for Mobile & Touch Screen */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="w-full h-14 bg-slate-950/80 hover:bg-amber-500/20 active:bg-amber-500/30 text-slate-100 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-xl font-bold font-mono transition-all shadow-sm flex items-center justify-center active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="w-full h-14 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center active:scale-95"
            >
              DEL
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-full h-14 bg-slate-950/80 hover:bg-amber-500/20 active:bg-amber-500/30 text-slate-100 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-xl font-bold font-mono transition-all shadow-sm flex items-center justify-center active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              className="w-full h-14 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center active:scale-95"
            >
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Remember Device Checkbox */}
          <div className="flex items-center justify-center space-x-2 pt-2 text-xs text-slate-400">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 accent-amber-400 cursor-pointer"
            />
            <label htmlFor="remember" className="cursor-pointer select-none">
              Remember this device (30 Days)
            </label>
          </div>
        </form>

        {/* Security Note / Default Hint */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
            <span>256-bit Encrypted Session</span>
          </span>
          <span>Passcode: <code className="text-amber-400/80">4882</code></span>
        </div>
      </div>
    </div>
  );
};
