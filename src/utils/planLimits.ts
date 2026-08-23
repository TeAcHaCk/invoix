import type { UserProfile } from '../context/AuthContext';

export type UserPlanTier = 'free' | 'pro' | 'agency' | 'enterprise';

export const FREE_PLAN_MAX_DOCUMENTS = 3;

/**
 * Checks if user is on any active paid tier
 */
export const isPaidPlan = (profile?: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.plan === 'pro' || profile.plan === 'agency' || profile.plan === 'enterprise';
};

/**
 * Checks if user has permission to completely disable watermarks
 */
export const canDisableWatermark = (profile?: UserProfile | null): boolean => {
  return isPaidPlan(profile);
};

/**
 * Returns the maximum number of proposals/documents allowed in history vault
 */
export const getMaxDocumentLimit = (profile?: UserProfile | null): number => {
  if (isPaidPlan(profile)) {
    return Infinity;
  }
  return FREE_PLAN_MAX_DOCUMENTS;
};

/**
 * Checks if user has reached their document vault quota
 */
export const hasReachedVaultLimit = (currentCount: number, profile?: UserProfile | null): boolean => {
  if (isPaidPlan(profile)) {
    return false;
  }
  return currentCount >= FREE_PLAN_MAX_DOCUMENTS;
};

/**
 * Checks if user can access Agency level features (multi-seat, custom domain)
 */
export const canAccessAgencyFeatures = (profile?: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.plan === 'agency' || profile.plan === 'enterprise';
};
