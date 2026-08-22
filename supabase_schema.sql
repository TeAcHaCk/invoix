-- ==============================================================================
-- UNIVERSAL QUOTATION & INVOICE SAAS — SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Instructions: Paste and run this script directly into Supabase SQL Editor.
-- It creates tables for user profiles, multi-tenant documents, view tracking,
-- subscriptions, promo codes, and platform settings with Row-Level Security.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (With Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  business_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency', 'enterprise')),
  currency_code TEXT DEFAULT 'USD',
  quotes_created_count INTEGER DEFAULT 0,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UNIVERSAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'QUOTATION' CHECK (type IN ('QUOTATION', 'INVOICE')),
  industry TEXT NOT NULL DEFAULT 'creative_agency',
  theme TEXT NOT NULL DEFAULT 'modern',
  title TEXT,
  client_name TEXT,
  client_email TEXT,
  total_investment NUMERIC DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'PAID', 'OVERDUE')),
  is_public BOOLEAN DEFAULT TRUE,
  document_data JSONB NOT NULL,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOCUMENT VIEWS AUDIT LOG TABLE (Client Analytics)
CREATE TABLE IF NOT EXISTS public.document_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id TEXT REFERENCES public.documents(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'agency', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  gateway TEXT DEFAULT 'stripe' CHECK (gateway IN ('stripe', 'razorpay', 'manual')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT 100,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PLATFORM SETTINGS TABLE (Dynamic Global Config)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  free_quotes_per_month INTEGER DEFAULT 3,
  pro_price_monthly NUMERIC DEFAULT 9,
  agency_price_monthly NUMERIC DEFAULT 29,
  enable_e_signatures BOOLEAN DEFAULT TRUE,
  enable_client_upsells BOOLEAN DEFAULT TRUE,
  enable_pdf_watermark BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings if not present
INSERT INTO public.platform_settings (id, free_quotes_per_month, pro_price_monthly, agency_price_monthly)
VALUES ('global_config', 3, 9, 29)
ON CONFLICT (id) DO NOTHING;

-- INDEXES for Ultra-Fast Queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_views_doc_id ON public.document_views(document_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES FOR PROFILES
CREATE POLICY "Users can view their own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile or admins can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS POLICIES FOR DOCUMENTS
CREATE POLICY "Creators can view own documents or admins can view all"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id OR (is_public = TRUE) OR public.is_admin());

CREATE POLICY "Creators can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update own documents or admins can update any"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id OR (is_public = TRUE) OR public.is_admin());

CREATE POLICY "Creators can delete own documents or admins can delete any"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- RLS POLICIES FOR SUBSCRIPTIONS
CREATE POLICY "Users can view their own subscriptions or admins view all"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin());

-- RLS POLICIES FOR PROMO CODES
CREATE POLICY "Anyone can check promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (public.is_admin());

-- RLS POLICIES FOR PLATFORM SETTINGS
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (public.is_admin());

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, business_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'business_name',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
