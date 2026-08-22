import { getSupabaseClient } from '../lib/supabase';
import type { UserProfile } from '../context/AuthContext';
import { getVaultDocuments } from '../utils/vaultStorage';

export interface AdminDashboardStats {
  totalRevenueMonthly: number;
  totalUsersCount: number;
  totalProposalsCount: number;
  activeSubscriptionsCount: number;
  conversionRatePercent: number;
  industryBreakdown: { name: string; count: number; percentage: number }[];
  recentActivity: {
    id: string;
    type: 'signup' | 'proposal_created' | 'proposal_approved' | 'plan_upgraded';
    title: string;
    subtitle: string;
    timestamp: string;
  }[];
}

export interface AdminSubscriptionRecord {
  id: string;
  user_id: string;
  user_email?: string;
  user_business?: string;
  plan: 'pro' | 'agency' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  gateway: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_end: string;
  created_at: string;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  times_used: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface PlatformSettingsRecord {
  free_quotes_per_month: number;
  pro_price_monthly: number;
  agency_price_monthly: number;
  enable_e_signatures: boolean;
  enable_client_upsells: boolean;
  enable_pdf_watermark: boolean;
}

const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsRecord = {
  free_quotes_per_month: 3,
  pro_price_monthly: 9,
  agency_price_monthly: 29,
  enable_e_signatures: true,
  enable_client_upsells: true,
  enable_pdf_watermark: true,
};

// 1. Fetch Dashboard Stats
export const fetchAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const supabase = getSupabaseClient();
  const localDocs = getVaultDocuments();

  if (!supabase) {
    // Demo Mock / Local Stats
    const approvedDocs = localDocs.filter((d) => d.signatory?.clientSignedName);
    const totalVolume = localDocs.reduce((acc, d) => acc + (d.totalInvestment || 0), 0);
    const conversion = localDocs.length > 0 ? Math.round((approvedDocs.length / localDocs.length) * 100) : 68;

    return {
      totalRevenueMonthly: Math.max(1470, Math.round(totalVolume * 0.05)),
      totalUsersCount: 142,
      totalProposalsCount: Math.max(localDocs.length, 384),
      activeSubscriptionsCount: 38,
      conversionRatePercent: conversion,
      industryBreakdown: [
        { name: 'Creative Agency', count: 124, percentage: 32 },
        { name: 'Software & Tech', count: 98, percentage: 26 },
        { name: 'Consulting', count: 64, percentage: 17 },
        { name: 'Photography & Events', count: 52, percentage: 14 },
        { name: 'Construction & Interior', count: 46, percentage: 11 },
      ],
      recentActivity: [
        {
          id: 'act-1',
          type: 'proposal_approved',
          title: 'Proposal Approved ($4,800)',
          subtitle: 'Nexus Tech signed by Acme Corp',
          timestamp: '10 mins ago',
        },
        {
          id: 'act-2',
          type: 'plan_upgraded',
          title: 'New Agency Plan Subscriber ($29/mo)',
          subtitle: 'Pixel Perfect Studios upgraded via Stripe',
          timestamp: '35 mins ago',
        },
        {
          id: 'act-3',
          type: 'signup',
          title: 'New Business Registered',
          subtitle: 'Apex Consulting (apex@consult.com)',
          timestamp: '1 hour ago',
        },
      ],
    };
  }

  try {
    const [profilesRes, docsRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('id, plan, role', { count: 'exact' }),
      supabase.from('documents').select('id, industry, status, total_investment, created_at', { count: 'exact' }),
      supabase.from('subscriptions').select('amount, status').eq('status', 'active'),
    ]);

    const totalUsers = profilesRes.count || 1;
    const totalDocs = docsRes.count || 0;
    const activeSubs = subsRes.data?.length || 0;
    const mrr = subsRes.data?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

    const approvedCount = docsRes.data?.filter((d) => d.status === 'APPROVED').length || 0;
    const conversion = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;

    // Industry aggregation
    const industryCounts: Record<string, number> = {};
    docsRes.data?.forEach((d) => {
      industryCounts[d.industry] = (industryCounts[d.industry] || 0) + 1;
    });

    const breakdown = Object.entries(industryCounts).map(([name, count]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      count,
      percentage: totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0,
    }));

    return {
      totalRevenueMonthly: mrr,
      totalUsersCount: totalUsers,
      totalProposalsCount: totalDocs,
      activeSubscriptionsCount: activeSubs,
      conversionRatePercent: conversion,
      industryBreakdown: breakdown.length > 0 ? breakdown : [
        { name: 'Creative Agency', count: 1, percentage: 100 },
      ],
      recentActivity: [
        {
          id: 'act-real-1',
          type: 'proposal_created',
          title: `${totalDocs} Proposals Generated`,
          subtitle: 'Active cloud synchronization',
          timestamp: 'Live',
        },
      ],
    };
  } catch (e) {
    console.error('Error fetching admin dashboard stats:', e);
    return {
      totalRevenueMonthly: 0,
      totalUsersCount: 1,
      totalProposalsCount: 0,
      activeSubscriptionsCount: 0,
      conversionRatePercent: 0,
      industryBreakdown: [],
      recentActivity: [],
    };
  }
};

// 2. Fetch Users List
export const fetchAdminUsersList = async (): Promise<UserProfile[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Return sample users in standalone mode
    return [
      {
        id: 'u-1',
        email: 'founder@studio.com',
        business_name: 'Studio Owner (You)',
        role: 'superadmin',
        plan: 'agency',
        currency_code: 'USD',
      },
      {
        id: 'u-2',
        email: 'alex@designflow.io',
        business_name: 'DesignFlow Creative',
        role: 'user',
        plan: 'pro',
        currency_code: 'USD',
      },
      {
        id: 'u-3',
        email: 'contact@buildcraft.co',
        business_name: 'BuildCraft Interiors',
        role: 'user',
        plan: 'free',
        currency_code: 'INR',
      },
      {
        id: 'u-4',
        email: 'sara@quantumtech.dev',
        business_name: 'Quantum Tech Consulting',
        role: 'user',
        plan: 'agency',
        currency_code: 'EUR',
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as UserProfile[];
    }
  } catch (err) {
    console.error('Error fetching admin users list:', err);
  }

  return [];
};

// 3. Update User Plan / Role
export const updateUserPlanOrRole = async (
  userId: string,
  updates: { plan?: 'free' | 'pro' | 'agency' | 'enterprise'; role?: 'user' | 'admin' | 'superadmin'; is_suspended?: boolean }
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  } catch (err) {
    console.error('Failed to update user in admin panel:', err);
    return false;
  }
};

// 4. Fetch Platform Documents
export const fetchPlatformDocuments = async (): Promise<any[]> => {
  const supabase = getSupabaseClient();
  const localDocs = getVaultDocuments();

  if (!supabase) {
    return localDocs.map((d) => ({
      id: d.id,
      title: d.packageBannerTitle || d.client.nameOfEvent || 'Proposal',
      client_name: d.client.clientName || 'Client',
      type: d.type,
      industry: d.industry,
      total_investment: d.totalInvestment,
      currency_code: d.currency.code,
      status: d.signatory?.clientSignedName ? 'APPROVED' : 'SENT',
      views_count: 3,
      created_at: new Date().toISOString(),
    }));
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, client_name, type, industry, total_investment, currency_code, status, views_count, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.error('Error fetching platform documents:', err);
  }

  return [];
};

// 5. Promo Codes Management
export const fetchPromoCodes = async (): Promise<PromoCodeRecord[]> => {
  const supabase = getSupabaseClient();
  const localPromoKey = 'fbf_admin_promos_v1';

  if (!supabase) {
    const saved = localStorage.getItem(localPromoKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'promo-1',
        code: 'LAUNCH50',
        discount_percent: 50,
        max_uses: 200,
        times_used: 48,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'promo-2',
        code: 'AGENCYVIP',
        discount_percent: 100,
        max_uses: 20,
        times_used: 9,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data as PromoCodeRecord[];
  } catch (err) {
    console.error('Error fetching promo codes:', err);
  }
  return [];
};

export const createPromoCode = async (
  code: string,
  discountPercent: number,
  maxUses: number = 100
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  const newPromo: PromoCodeRecord = {
    id: `promo_${Date.now()}`,
    code: code.trim().toUpperCase(),
    discount_percent: discountPercent,
    max_uses: maxUses,
    times_used: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    const current = await fetchPromoCodes();
    localStorage.setItem('fbf_admin_promos_v1', JSON.stringify([newPromo, ...current]));
    return true;
  }

  try {
    const { error } = await supabase.from('promo_codes').insert({
      code: newPromo.code,
      discount_percent: discountPercent,
      max_uses: maxUses,
    });
    return !error;
  } catch (err) {
    console.error('Failed to create promo code in cloud:', err);
    return false;
  }
};

// 6. Platform Settings
export const fetchPlatformSettings = async (): Promise<PlatformSettingsRecord> => {
  const supabase = getSupabaseClient();
  const localSettingsKey = 'fbf_platform_settings_v1';

  const saved = localStorage.getItem(localSettingsKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }

  if (!supabase) return DEFAULT_PLATFORM_SETTINGS;

  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global_config')
      .single();

    if (!error && data) {
      return data as PlatformSettingsRecord;
    }
  } catch (err) {
    console.error('Error fetching platform settings:', err);
  }

  return DEFAULT_PLATFORM_SETTINGS;
};

export const savePlatformSettings = async (settings: PlatformSettingsRecord): Promise<boolean> => {
  localStorage.setItem('fbf_platform_settings_v1', JSON.stringify(settings));

  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ id: 'global_config', ...settings, updated_at: new Date().toISOString() });
    return !error;
  } catch (err) {
    console.error('Failed to save platform settings to cloud:', err);
    return false;
  }
};
