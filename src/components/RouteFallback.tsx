import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shown while a lazily-loaded route chunk downloads.
 *
 * Deliberately matches the app's background so the transition reads as the page
 * still loading rather than a flash of empty white — on a slow connection the
 * editor chunk can take a noticeable moment.
 */
export const RouteFallback: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
    <Loader2 className="w-7 h-7 text-amber-400 animate-spin mb-3" />
    <p className="text-sm font-semibold text-slate-300">{label}</p>
  </div>
);
