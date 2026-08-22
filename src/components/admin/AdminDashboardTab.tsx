import React, { useState, useEffect } from 'react';
import {
  fetchAdminDashboardStats,
  type AdminDashboardStats,
} from '../../services/adminService';
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  PieChart,
  Layers,
} from 'lucide-react';

export const AdminDashboardTab: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboardStats().then((data) => {
      setStats(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 skeleton rounded" />
                <div className="h-8 w-8 skeleton rounded-xl" />
              </div>
              <div className="h-7 w-20 skeleton rounded mt-2" />
              <div className="h-3 w-32 skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="h-4 w-36 skeleton rounded" />
            <div className="space-y-3 pt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-full skeleton rounded" />
                  <div className="h-2 w-full skeleton rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="h-4 w-36 skeleton rounded" />
            <div className="space-y-3 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring Revenue */}
        <div className="glass rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover-glow-emerald">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Monthly Revenue (MRR)
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              ${stats.totalRevenueMonthly.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+24.5% vs last month</span>
            </p>
          </div>
        </div>

        {/* Registered Users */}
        <div className="glass rounded-3xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover-glow-amber">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Active Tenants / Users
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              {stats.totalUsersCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              <strong className="text-amber-300 font-semibold">{stats.activeSubscriptionsCount}</strong> paying subscribers
            </p>
          </div>
        </div>

        {/* Platform Proposals Generated */}
        <div className="glass rounded-3xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover-glow-blue">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Proposals & Invoices
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              {stats.totalProposalsCount.toLocaleString()}
            </h3>
            <p className="text-[11px] text-blue-400 flex items-center space-x-1 mt-1 font-semibold">
              <span>Across 6 global industries</span>
            </p>
          </div>
        </div>

        {/* Proposal Acceptance Rate */}
        <div className="glass rounded-3xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover-glow-purple">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
              Client Sign-off Rate
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              {stats.conversionRatePercent}%
            </h3>
            <p className="text-[11px] text-purple-400 mt-1 font-semibold">
              High-converting interactive format
            </p>
          </div>
        </div>
      </div>

      {/* Middle Split: Industry Distribution & Realtime Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div className="glass rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
                Industry Usage Breakdown
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-mono">
              Top Categories
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {stats.industryBreakdown.map((ind, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-200">{ind.name}</span>
                  <span className="text-slate-400 font-mono">
                    {ind.count} quotes ({ind.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-slate-800/80 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 transition-all duration-700"
                    style={{ width: `${Math.max(5, ind.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
                Live Platform Events
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
              Realtime
            </span>
          </div>

          <div className="space-y-3">
            {stats.recentActivity.map((act) => (
              <div
                key={act.id}
                className="bg-slate-950/60 border border-slate-800/70 rounded-2xl p-3.5 flex items-start space-x-3.5 transition-all hover:border-slate-700/80"
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 shrink-0 mt-0.5">
                  {act.type === 'proposal_approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : act.type === 'plan_upgraded' ? (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Layers className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-100 truncate">{act.title}</p>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
