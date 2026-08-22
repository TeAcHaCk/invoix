import React, { useState, useEffect } from 'react';
import {
  fetchPromoCodes,
  createPromoCode,
  type PromoCodeRecord,
} from '../../services/adminService';
import {
  Tag,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

export const AdminBillingTab: React.FC = () => {
  const [promos, setPromos] = useState<PromoCodeRecord[]>([]);
  const [newCode, setNewCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPromoCodes().then(setPromos);
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setIsCreating(true);
    const success = await createPromoCode(newCode, discountPercent, maxUses);
    if (success) {
      setNewCode('');
      setSuccessMsg(`Promo code ${newCode.toUpperCase()} created successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      const updated = await fetchPromoCodes();
      setPromos(updated);
    }
    setIsCreating(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Revenue & Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
            Pro Plan ($9/mo)
          </span>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-amber-300 font-mono">24 Active Subscribers</h4>
            <p className="text-[11px] text-slate-400 mt-1">$216 MRR Contribution</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
            Agency Plan ($29/mo)
          </span>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-purple-300 font-mono">14 Active Subscribers</h4>
            <p className="text-[11px] text-slate-400 mt-1">$406 MRR Contribution</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
            Annual Pre-payments
          </span>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-emerald-400 font-mono">8 Subscriptions</h4>
            <p className="text-[11px] text-slate-400 mt-1">$1,840 Upfront Cash Collected</p>
          </div>
        </div>
      </div>

      {/* Promo Code Generator & Active Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Coupon Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
              Create Discount Promo Code
            </h3>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Coupon Code (e.g. LAUNCH50)
              </label>
              <input
                type="text"
                required
                placeholder="PROMO2026"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-center focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all mt-2"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Generate Promo Code</span>
            </button>
          </form>
        </div>

        {/* Promo Codes List */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
              Active Promo Coupons
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{promos.length} codes active</span>
          </div>

          <div className="space-y-2.5">
            {promos.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 text-amber-300 rounded-lg font-mono font-bold text-xs border border-amber-500/30">
                    {p.code}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{p.discount_percent}% OFF Subscription</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Used {p.times_used} of {p.max_uses} max redemptions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(p.code)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors flex items-center space-x-1"
                >
                  {copiedCode === p.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
