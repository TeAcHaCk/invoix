import React, { useState, useEffect } from 'react';
import {
  fetchPlatformSettings,
  savePlatformSettings,
  type PlatformSettingsRecord,
} from '../../services/adminService';
import {
  Sliders,
  CheckCircle2,
  DollarSign,
  Save,
  Loader2,
} from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformSettings().then((data) => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    const success = await savePlatformSettings(settings);
    if (success) {
      setSuccessMsg('Global platform settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setIsSaving(false);
  };

  if (isLoading || !settings) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn max-w-4xl">
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Tier Quotas & Pricing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
            SaaS Plan Pricing & Quota Limits
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Free Tier Monthly Quote Quota
            </label>
            <input
              type="number"
              min={1}
              value={settings.free_quotes_per_month}
              onChange={(e) =>
                setSettings({ ...settings, free_quotes_per_month: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">Users get prompted to upgrade after reaching this limit.</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Pro Monthly Price ($USD)
            </label>
            <input
              type="number"
              min={1}
              value={settings.pro_price_monthly}
              onChange={(e) =>
                setSettings({ ...settings, pro_price_monthly: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">Unlimited proposals & custom branding.</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Agency Monthly Price ($USD)
            </label>
            <input
              type="number"
              min={1}
              value={settings.agency_price_monthly}
              onChange={(e) =>
                setSettings({ ...settings, agency_price_monthly: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">Multi-user team access & priority rendering.</p>
          </div>
        </div>
      </div>

      {/* Global Feature Switches */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
            Global Feature Switches
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
            <div>
              <p className="font-bold text-slate-200">Interactive Digital E-Signatures</p>
              <p className="text-[11px] text-slate-400">Allow clients to draw signatures and legally sign proposals.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_e_signatures}
              onChange={(e) =>
                setSettings({ ...settings, enable_e_signatures: e.target.checked })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
            <div>
              <p className="font-bold text-slate-200">Client Live Upsell Checkboxes</p>
              <p className="text-[11px] text-slate-400">Allow clients to customize packages by toggling optional items.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_client_upsells}
              onChange={(e) =>
                setSettings({ ...settings, enable_client_upsells: e.target.checked })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
            <div>
              <p className="font-bold text-slate-200">Custom Document Watermarks</p>
              <p className="text-[11px] text-slate-400">Enable diagonal security watermarks on exported PDF proposals.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_pdf_watermark}
              onChange={(e) =>
                setSettings({ ...settings, enable_pdf_watermark: e.target.checked })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all disabled:opacity-50 text-xs"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Global Configuration</span>
        </button>
      </div>
    </form>
  );
};
