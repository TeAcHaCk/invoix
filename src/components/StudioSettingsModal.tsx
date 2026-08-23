import React, { useRef, useState, useEffect } from 'react';
import type { StudioProfile } from '../types';
import { Building2, X, Upload, Check, CreditCard } from 'lucide-react';
import { processLogoFile } from '../utils/imageTrim';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studio: StudioProfile;
  onSave: (updatedStudio: StudioProfile) => void;
}

export const StudioSettingsModal: React.FC<StudioSettingsModalProps> = ({
  isOpen,
  onClose,
  studio,
  onSave,
}) => {
  const [formData, setFormData] = useState<StudioProfile>(studio);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(studio);
  }, [studio]);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await processLogoFile(file);
      if (res.success && res.dataUrl) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: res.dataUrl!,
        }));
      } else if (res.error) {
        alert(res.error);
      }
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-100 font-['Outfit']">
                Business Profile & Default Branding
              </h3>
              <p className="text-xs text-slate-400">
                Configure your permanent business details, logo, and bank accounts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Logo Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Brand Logo</label>
                <p className="text-[11px] text-slate-400">
                  PNG, SVG, JPG or WEBP. Auto-trimmed and optimized for retina crispness.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {formData.logoUrl && (
                  <div className="bg-white p-2 rounded-lg border border-slate-700">
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="max-h-10 max-w-[120px] object-contain"
                    />
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/svg+xml,image/jpeg,image/webp,.png,.svg,.jpg,.jpeg,.webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{formData.logoUrl ? 'Change' : 'Upload'}</span>
                </button>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="px-2 py-1 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {formData.logoUrl && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Width</span>
                      <span className="font-mono text-amber-300 font-bold">{formData.logoWidth || 260}px</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="400"
                      step="10"
                      value={formData.logoWidth || 260}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logoWidth: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Max Height</span>
                      <span className="font-mono text-amber-300 font-bold">{formData.logoHeight || 90}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="160"
                      step="5"
                      value={formData.logoHeight || 90}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logoHeight: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Business / Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Business Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Phone Numbers</label>
              <input
                type="text"
                value={formData.phoneNumbers}
                onChange={(e) => setFormData({ ...formData, phoneNumbers: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tax ID / GSTIN / VAT Reg</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Banking & Remittance Details */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center space-x-2 text-amber-300 font-bold mb-3 font-['Outfit']">
              <CreditCard className="w-4 h-4" />
              <span>Banking & Payment Remittance</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">IFSC / SWIFT / Routing Code</label>
                <input
                  type="text"
                  value={formData.ifscCode || ''}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolder || ''}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-emerald-400 font-semibold mb-1">
                  UPI ID or Online Payment Link (Auto-generates Payment QR on invoices)
                </label>
                <input
                  type="text"
                  placeholder="e.g. username@upi or https://buy.stripe.com/xxx"
                  value={formData.upiId || formData.paymentLink || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      upiId: e.target.value,
                      paymentLink: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
