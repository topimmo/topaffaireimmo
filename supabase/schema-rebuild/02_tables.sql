-- =====================================================
-- 02_tables.sql - Complete Table Schema
-- =====================================================
-- Creates all 40+ tables for TopAffaireImmo platform
-- with complete field definitions, constraints, and comments
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =====================================================
-- USER & PROFILE TABLES
-- =====================================================

-- Profiles table (extends auth.users)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type TEXT DEFAULT 'advertiser' CHECK (user_type IN ('advertiser', 'agency')),
  agency_name TEXT,
  agency_logo TEXT,
  agency_description_fr TEXT,
  agency_description_ar TEXT,
  agency_cities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with additional information';

-- Admins table
DROP TABLE IF EXISTS public.admins CASCADE;
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admins IS 'Admin users with elevated privileges';

-- =====================================================
-- LOCATION TABLES
-- =====================================================

-- Cities table
DROP TABLE IF EXISTS public.cities CASCADE;
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.cities IS 'Moroccan cities with multilingual names';

-- Neighborhoods table
DROP TABLE IF EXISTS public.neighborhoods CASCADE;
CREATE TABLE public.neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.neighborhoods IS 'City neighborhoods with multilingual names';

-- =====================================================
-- PROPERTY TABLES
-- =====================================================

-- Properties table
DROP TABLE IF EXISTS public.properties CASCADE;
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent')),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'villa', 'commercial', 'land')),
  city_id INTEGER NOT NULL REFERENCES public.cities(id),
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id),
  custom_neighborhood TEXT,
  address TEXT,
  price DECIMAL(15,2) NOT NULL,
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  title_en TEXT,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'inactive')),
  featured BOOLEAN DEFAULT FALSE,
  phone TEXT,
  contact_visibility TEXT DEFAULT 'hidden' CHECK (contact_visibility IN ('visible', 'hidden')),
  advertiser_type TEXT CHECK (advertiser_type IN ('proprietaire', 'courtier', 'agence')),
  rejection_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.properties IS 'Property listings with complete moderation workflow';

-- Property Images table
DROP TABLE IF EXISTS public.property_images CASCADE;
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.property_images IS 'Property image metadata with ordering';

-- =====================================================
-- SERVICE CATEGORY TABLES
-- =====================================================

-- Service Categories table
DROP TABLE IF EXISTS public.service_categories CASCADE;
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.service_categories IS 'Home service categories (plomberie, electricite, etc.)';

-- Service Subcategories table
DROP TABLE IF EXISTS public.service_subcategories CASCADE;
CREATE TABLE public.service_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.service_subcategories IS 'Subcategories for granular service classification';

-- =====================================================
-- ARTISAN TABLES
-- =====================================================

-- Artisan Profiles table
DROP TABLE IF EXISTS public.artisan_profiles CASCADE;
CREATE TABLE public.artisan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  description_fr TEXT,
  description_ar TEXT,
  cities INTEGER[] NOT NULL DEFAULT '{}',
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_boosted BOOLEAN DEFAULT FALSE,
  boosted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_category_id)
);

COMMENT ON TABLE public.artisan_profiles IS 'Service provider profiles for home services';

-- Artisan Profile Neighborhoods table (join table)
DROP TABLE IF EXISTS public.artisan_profile_neighborhoods CASCADE;
CREATE TABLE public.artisan_profile_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_profile_id UUID NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  neighborhood_id INTEGER NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artisan_profile_id, neighborhood_id)
);

COMMENT ON TABLE public.artisan_profile_neighborhoods IS 'Many-to-many mapping of artisan profiles to neighborhoods';

-- Artisan Services table
DROP TABLE IF EXISTS public.artisan_services CASCADE;
CREATE TABLE public.artisan_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
  city TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artisan_id, subcategory_id, city)
);

COMMENT ON TABLE public.artisan_services IS 'Services offered by artisans with moderation workflow';

-- =====================================================
-- SERVICE REQUEST TABLES
-- =====================================================

-- Service Requests table
DROP TABLE IF EXISTS public.requests CASCADE;
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_profile_id UUID REFERENCES public.artisan_profiles(id) ON DELETE SET NULL,
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  neighborhood_id INTEGER REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email')),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_whatsapp TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),
  budget_min INTEGER CHECK (budget_min >= 0),
  budget_max INTEGER CHECK (budget_max >= budget_min),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'contacted', 'accepted', 'rejected', 'completed', 'cancelled')),
  artisan_response TEXT,
  artisan_responded_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  viewed_by_artisan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.requests IS 'Service requests from clients to artisans';

-- Request Status History table
DROP TABLE IF EXISTS public.request_status_history CASCADE;
CREATE TABLE public.request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.request_status_history IS 'Audit trail for service request status changes';

-- =====================================================
-- REVIEW TABLES
-- =====================================================

-- Reviews table
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_profile_id UUID NOT NULL REFERENCES public.artisan_profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  would_recommend BOOLEAN DEFAULT TRUE,
  artisan_response TEXT,
  artisan_responded_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderation_note TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_client_artisan_request UNIQUE (client_id, artisan_profile_id, request_id)
);

COMMENT ON TABLE public.reviews IS 'Client reviews and ratings for artisan profiles';

-- =====================================================
-- MONETIZATION TABLES
-- =====================================================

-- Wallets table
DROP TABLE IF EXISTS public.wallets CASCADE;
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_mad INTEGER NOT NULL DEFAULT 0 CHECK (balance_mad >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.wallets IS 'User wallet balances in MAD (Moroccan Dirham)';

-- Wallet Transactions table
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_mad INTEGER NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.wallet_transactions IS 'Audit trail of all wallet operations';

-- Payments table
DROP TABLE IF EXISTS public.payments CASCADE;
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_mad DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MAD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash', 'bank_transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Payment transactions for boosts and services';

-- Boost Plans table
DROP TABLE IF EXISTS public.boost_plans CASCADE;
CREATE TABLE public.boost_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MAD',
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.boost_plans IS 'Available boost plans for property listings';

-- Property Boosts table
DROP TABLE IF EXISTS public.property_boosts CASCADE;
CREATE TABLE public.property_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.boost_plans(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.property_boosts IS 'Active and historical property boost subscriptions';

-- Phone Reveal Events table
DROP TABLE IF EXISTS public.phone_reveal_events CASCADE;
CREATE TABLE public.phone_reveal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'artisan')),
  entity_id UUID NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.phone_reveal_events IS 'Analytics for phone number reveals';

-- Contact Access Passes table
DROP TABLE IF EXISTS public.contact_access_passes CASCADE;
CREATE TABLE public.contact_access_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id INTEGER NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.contact_access_passes IS 'Time-limited access passes for contact reveals';

-- =====================================================
-- ADVERTISING TABLES
-- =====================================================

-- Banner Requests table
DROP TABLE IF EXISTS public.banner_requests CASCADE;
CREATE TABLE public.banner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.banner_requests IS 'Requests for banner advertising placements';

-- Promo Banners table
DROP TABLE IF EXISTS public.promo_banners CASCADE;
CREATE TABLE public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL CHECK (placement IN ('homepage_hero', 'sidebar', 'listings_top', 'listings_bottom')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.promo_banners IS 'Promotional banner ads with tracking';

-- =====================================================
-- CMS TABLES
-- =====================================================

-- Site Pages table
DROP TABLE IF EXISTS public.site_pages CASCADE;
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_fr TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  meta_description_fr TEXT,
  meta_description_ar TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.site_pages IS 'CMS pages for static content';

-- Site Categories table
DROP TABLE IF EXISTS public.site_categories CASCADE;
CREATE TABLE public.site_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.site_categories IS 'Categories for organizing CMS content';

-- SEO Guides table
DROP TABLE IF EXISTS public.seo_guides CASCADE;
CREATE TABLE public.seo_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_fr TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  meta_description_fr TEXT,
  meta_description_ar TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.seo_guides IS 'SEO-optimized guides and informational content';

-- =====================================================
-- NOTIFICATION TABLES
-- =====================================================

-- Notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('property_status', 'lead', 'payment', 'system', 'artisan_verification', 'boost')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'User notifications for various events';

-- Push Subscriptions table
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS 'Web push notification subscriptions';

-- =====================================================
-- AUTHENTICATION TABLES
-- =====================================================

-- OTP Attempts table
DROP TABLE IF EXISTS public.otp_attempts CASCADE;
CREATE TABLE public.otp_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.otp_attempts IS 'OTP verification attempts for phone authentication';

-- SMS Logs table
DROP TABLE IF EXISTS public.sms_logs CASCADE;
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  provider TEXT DEFAULT 'vonage' CHECK (provider IN ('vonage', 'twilio', 'other')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.sms_logs IS 'SMS notification logs for tracking and debugging';

-- =====================================================
-- ADMIN TABLES
-- =====================================================

-- Admin Audit Logs table
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admin_audit_logs IS 'Audit trail for admin actions';

-- Admin Notifications table
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admin_notifications IS 'System notifications for admins';

-- =====================================================
-- MONITORING TABLES
-- =====================================================

-- System Logs table
DROP TABLE IF EXISTS public.system_logs CASCADE;
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  correlation_id TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.system_logs IS 'Centralized logging for production monitoring';

-- Performance Metrics table
DROP TABLE IF EXISTS public.performance_metrics CASCADE;
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('query', 'api', 'page_load', 'image_load')),
  metric_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.performance_metrics IS 'Performance monitoring for queries and operations';

-- Analytics Events table
DROP TABLE IF EXISTS public.analytics_events CASCADE;
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('listing_view', 'profile_view', 'phone_reveal', 'search')),
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.analytics_events IS 'Privacy-safe analytics events without personal data';

-- Alert Configurations table
DROP TABLE IF EXISTS public.alert_configurations CASCADE;
CREATE TABLE public.alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error_spike', 'storage_failure', 'db_latency', 'custom')),
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER DEFAULT 5,
  notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.alert_configurations IS 'Alert configurations for monitoring';

-- Alert History table
DROP TABLE IF EXISTS public.alert_history CASCADE;
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id UUID REFERENCES public.alert_configurations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  trigger_count INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.alert_history IS 'History of triggered alerts';

-- Media table
DROP TABLE IF EXISTS public.media CASCADE;
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'artisan_profile', 'review', 'banner')),
  entity_id UUID,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.media IS 'Media file metadata and storage references';

-- Platform Settings table
DROP TABLE IF EXISTS public.platform_settings CASCADE;
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.platform_settings IS 'Platform-wide configuration settings';

-- Email Resend Attempts table
DROP TABLE IF EXISTS public.email_resend_attempts CASCADE;
CREATE TABLE public.email_resend_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.email_resend_attempts IS 'Rate limiting for email confirmation resends';

-- =====================================================
-- END OF TABLES
-- =====================================================
