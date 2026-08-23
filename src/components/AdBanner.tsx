import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, ArrowRight } from 'lucide-react';

interface AdBannerProps {
  format?: 'horizontal' | 'rectangle' | 'compact';
  slot?: string;
  className?: string;
  onUpgradeClick?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  format = 'horizontal',
  slot = '1234567890',
  className = '',
  onUpgradeClick,
}) => {
  const { profile } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);

  // 1. Pro / Agency / Enterprise users get a 100% AD-FREE experience!
  const isPaidUser = profile?.plan === 'pro' || profile?.plan === 'agency' || profile?.plan === 'enterprise';
  if (isPaidUser) {
    return null;
  }

  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const isLiveAdSense = typeof window !== 'undefined' && Boolean((window as any).adsbygoogle) && Boolean(adsenseClientId);

  useEffect(() => {
    if (isLiveAdSense) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense render error:', err);
      }
    }
  }, [isLiveAdSense]);

  // If live AdSense is active on domain
  if (isLiveAdSense && adsenseClientId) {
    return (
      <div className={`ad-container overflow-hidden text-center my-4 ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Fallback / Pre-AdSense Elegant Native Promo Card (High conversion to Invoix Pro)
  return (
    <div
      ref={adRef}
      className={`relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-3.5 shadow-xl ${
        format === 'horizontal'
          ? 'max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3'
          : format === 'compact'
          ? 'flex items-center justify-between gap-2 text-xs py-2 px-3'
          : 'flex flex-col space-y-3 text-center p-4'
      } ${className}`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />

      <div className="flex items-center space-x-3 text-left">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-100 font-['Outfit']">
              Upgrade to Invoix Pro
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
              Ad-Free
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Unlimited cloud vault, custom branding, and zero advertisements.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <a
          href="/#pricing"
          onClick={(e) => {
            if (onUpgradeClick) {
              e.preventDefault();
              onUpgradeClick();
            }
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-1 transition-all cursor-pointer"
        >
          <span>From ₹399/mo</span>
          <ArrowRight className="w-3 h-3 stroke-[2.5]" />
        </a>
      </div>
    </div>
  );
};
