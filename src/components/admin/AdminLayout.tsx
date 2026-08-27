import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminDocumentsTab } from './AdminDocumentsTab';
import { AdminBillingTab } from './AdminBillingTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  ArrowLeft,
  Database,
  Crown,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'documents' | 'billing' | 'settings';

interface AdminLayoutProps {
  onBackToStudio: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToStudio }) => {
  const { isCloudConnected, isAdmin, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const navItems = [
    { id: 'overview' as AdminTab, label: 'Dashboard & MRR', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users' as AdminTab, label: 'Users & Tenants', icon: <Users className="w-4 h-4" /> },
    { id: 'documents' as AdminTab, label: 'Platform Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'billing' as AdminTab, label: 'Billing & Promos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'settings' as AdminTab, label: 'Pricing & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  /*
    Real access gate.

    Hiding the "Super Admin" link only removed the signpost — /#admin still
    rendered this whole panel for anyone who typed the URL. Platform data was
    never at risk (RLS and admin_set_user_plan enforce is_admin() server-side),
    but the UI leaked the shape of the admin surface and contradicted the claim
    that the panel is reachable only by admins.

    Waiting on isLoading matters: profile arrives asynchronously, so gating
    before it resolves would bounce a genuine admin on every refresh.
  */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <Loader2 className="w-7 h-7 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Checking access…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-100 font-['Outfit']">Admin access required</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {user
              ? 'This account does not have administrator permissions.'
              : 'Sign in with an administrator account to open this panel.'}
          </p>
          <button
            type="button"
            onClick={onBackToStudio}
            className="mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Back to Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col dot-grid-bg">
      {/* Top Admin Header Bar */}
      <header className="glass border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-8 py-3 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-100 font-['Outfit'] tracking-wide">
                  SaaS Control Center
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-bold uppercase font-['Outfit']">
                  Super Admin
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400">
                Multi-Tenant Oversight & Global Platform Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`hidden sm:flex items-center space-x-1.5 text-[10px] px-3 py-1 rounded-full border ${
                isCloudConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>{isCloudConnected ? 'Supabase PostgreSQL' : 'Local Sandbox'}</span>
            </div>

            <button
              type="button"
              onClick={onBackToStudio}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Back to Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0 space-y-2">
          <div className="glass rounded-3xl p-3 space-y-1 shadow-2xl border border-slate-800/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center space-x-3 transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Active Panel Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && <AdminDashboardTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'documents' && <AdminDocumentsTab />}
          {activeTab === 'billing' && <AdminBillingTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
};
