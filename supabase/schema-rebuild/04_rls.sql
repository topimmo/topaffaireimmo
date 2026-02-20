-- =====================================================
-- 04_rls.sql - Row-Level Security Policies
-- =====================================================
-- Creates all RLS policies for every table
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_profile_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_reveal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_access_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_resend_attempts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- ADMINS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "admins_select_admin_only" ON public.admins;
CREATE POLICY "admins_select_admin_only" ON public.admins
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "admins_insert_admin_only" ON public.admins;
CREATE POLICY "admins_insert_admin_only" ON public.admins
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "admins_update_admin_only" ON public.admins;
CREATE POLICY "admins_update_admin_only" ON public.admins
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "admins_delete_admin_only" ON public.admins;
CREATE POLICY "admins_delete_admin_only" ON public.admins
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- CITIES & NEIGHBORHOODS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "cities_select_public" ON public.cities;
CREATE POLICY "cities_select_public" ON public.cities FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "neighborhoods_select_public" ON public.neighborhoods;
CREATE POLICY "neighborhoods_select_public" ON public.neighborhoods FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "neighborhoods_insert_authenticated" ON public.neighborhoods;
CREATE POLICY "neighborhoods_insert_authenticated" ON public.neighborhoods
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "neighborhoods_manage_admin" ON public.neighborhoods;
CREATE POLICY "neighborhoods_manage_admin" ON public.neighborhoods
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- PROPERTIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "properties_insert_authenticated" ON public.properties;
CREATE POLICY "properties_insert_authenticated" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_select_admin" ON public.properties;
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "properties_select_public" ON public.properties;
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_delete_admin" ON public.properties;
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- PROPERTY IMAGES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "property_images_select_own" ON public.property_images;
CREATE POLICY "property_images_select_own" ON public.property_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "property_images_select_public" ON public.property_images;
CREATE POLICY "property_images_select_public" ON public.property_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND status = 'approved')
  );

DROP POLICY IF EXISTS "property_images_insert_own" ON public.property_images;
CREATE POLICY "property_images_insert_own" ON public.property_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "property_images_delete_own" ON public.property_images;
CREATE POLICY "property_images_delete_own" ON public.property_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "property_images_manage_admin" ON public.property_images;
CREATE POLICY "property_images_manage_admin" ON public.property_images
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- SERVICE CATEGORIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "service_categories_select_active_public" ON public.service_categories;
CREATE POLICY "service_categories_select_active_public" ON public.service_categories
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "service_categories_select_all_admin" ON public.service_categories;
CREATE POLICY "service_categories_select_all_admin" ON public.service_categories
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "service_categories_manage_admin" ON public.service_categories;
CREATE POLICY "service_categories_manage_admin" ON public.service_categories
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- SERVICE SUBCATEGORIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "service_subcategories_select_active_public" ON public.service_subcategories;
CREATE POLICY "service_subcategories_select_active_public" ON public.service_subcategories
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "service_subcategories_select_all_admin" ON public.service_subcategories;
CREATE POLICY "service_subcategories_select_all_admin" ON public.service_subcategories
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "service_subcategories_manage_admin" ON public.service_subcategories;
CREATE POLICY "service_subcategories_manage_admin" ON public.service_subcategories
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- ARTISAN PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "artisan_profiles_select_public" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_select_public" ON public.artisan_profiles
  FOR SELECT USING (is_active = TRUE AND is_verified = TRUE);

DROP POLICY IF EXISTS "artisan_profiles_select_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_select_own" ON public.artisan_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "artisan_profiles_insert_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_insert_own" ON public.artisan_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "artisan_profiles_update_own" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_update_own" ON public.artisan_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "artisan_profiles_manage_admin" ON public.artisan_profiles;
CREATE POLICY "artisan_profiles_manage_admin" ON public.artisan_profiles
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- ARTISAN PROFILE NEIGHBORHOODS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "artisan_profile_neighborhoods_select_public" ON public.artisan_profile_neighborhoods;
CREATE POLICY "artisan_profile_neighborhoods_select_public" ON public.artisan_profile_neighborhoods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles 
      WHERE id = artisan_profile_id AND is_active = TRUE AND is_verified = TRUE
    )
  );

DROP POLICY IF EXISTS "artisan_profile_neighborhoods_select_own" ON public.artisan_profile_neighborhoods;
CREATE POLICY "artisan_profile_neighborhoods_select_own" ON public.artisan_profile_neighborhoods
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.artisan_profiles WHERE id = artisan_profile_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "artisan_profile_neighborhoods_insert_own" ON public.artisan_profile_neighborhoods;
CREATE POLICY "artisan_profile_neighborhoods_insert_own" ON public.artisan_profile_neighborhoods
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.artisan_profiles WHERE id = artisan_profile_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "artisan_profile_neighborhoods_delete_own" ON public.artisan_profile_neighborhoods;
CREATE POLICY "artisan_profile_neighborhoods_delete_own" ON public.artisan_profile_neighborhoods
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.artisan_profiles WHERE id = artisan_profile_id AND user_id = auth.uid())
  );

-- =====================================================
-- ARTISAN SERVICES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "artisan_services_select_public" ON public.artisan_services;
CREATE POLICY "artisan_services_select_public" ON public.artisan_services
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "artisan_services_select_own" ON public.artisan_services;
CREATE POLICY "artisan_services_select_own" ON public.artisan_services
  FOR SELECT USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "artisan_services_select_admin" ON public.artisan_services;
CREATE POLICY "artisan_services_select_admin" ON public.artisan_services
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "artisan_services_insert_own" ON public.artisan_services;
CREATE POLICY "artisan_services_insert_own" ON public.artisan_services
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = artisan_id AND status IN ('pending', 'inactive')
  );

DROP POLICY IF EXISTS "artisan_services_update_own" ON public.artisan_services;
CREATE POLICY "artisan_services_update_own" ON public.artisan_services
  FOR UPDATE USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id AND status IN ('pending', 'inactive'));

DROP POLICY IF EXISTS "artisan_services_update_admin" ON public.artisan_services;
CREATE POLICY "artisan_services_update_admin" ON public.artisan_services
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "artisan_services_delete_own" ON public.artisan_services;
CREATE POLICY "artisan_services_delete_own" ON public.artisan_services
  FOR DELETE USING (auth.uid() = artisan_id AND status IN ('pending', 'rejected', 'inactive'));

DROP POLICY IF EXISTS "artisan_services_delete_admin" ON public.artisan_services;
CREATE POLICY "artisan_services_delete_admin" ON public.artisan_services
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- REQUESTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "requests_insert_client" ON public.requests;
CREATE POLICY "requests_insert_client" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "requests_select_client" ON public.requests;
CREATE POLICY "requests_select_client" ON public.requests
  FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "requests_select_artisan" ON public.requests;
CREATE POLICY "requests_select_artisan" ON public.requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "requests_update_client" ON public.requests;
CREATE POLICY "requests_update_client" ON public.requests
  FOR UPDATE USING (auth.uid() = client_id AND status IN ('pending', 'viewed'))
  WITH CHECK (auth.uid() = client_id AND status IN ('pending', 'viewed', 'cancelled'));

DROP POLICY IF EXISTS "requests_update_artisan" ON public.requests;
CREATE POLICY "requests_update_artisan" ON public.requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    ) AND status IN ('viewed', 'contacted', 'accepted', 'rejected', 'completed')
  );

DROP POLICY IF EXISTS "requests_manage_admin" ON public.requests;
CREATE POLICY "requests_manage_admin" ON public.requests
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- REQUEST STATUS HISTORY POLICIES
-- =====================================================

DROP POLICY IF EXISTS "request_status_history_select_involved" ON public.request_status_history;
CREATE POLICY "request_status_history_select_involved" ON public.request_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE id = request_id AND (client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.artisan_profiles
          WHERE id = artisan_profile_id AND user_id = auth.uid()
        ))
    )
  );

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (is_hidden = FALSE);

DROP POLICY IF EXISTS "reviews_insert_client" ON public.reviews;
CREATE POLICY "reviews_insert_client" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "reviews_update_client" ON public.reviews;
CREATE POLICY "reviews_update_client" ON public.reviews
  FOR UPDATE USING (auth.uid() = client_id AND created_at > NOW() - INTERVAL '30 days')
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "reviews_delete_client" ON public.reviews;
CREATE POLICY "reviews_delete_client" ON public.reviews
  FOR DELETE USING (auth.uid() = client_id AND created_at > NOW() - INTERVAL '7 days');

DROP POLICY IF EXISTS "reviews_select_artisan" ON public.reviews;
CREATE POLICY "reviews_select_artisan" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "reviews_update_artisan_response" ON public.reviews;
CREATE POLICY "reviews_update_artisan_response" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artisan_profiles
      WHERE id = artisan_profile_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "reviews_manage_admin" ON public.reviews;
CREATE POLICY "reviews_manage_admin" ON public.reviews
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- WALLETS & TRANSACTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_manage_admin" ON public.wallets;
CREATE POLICY "wallets_manage_admin" ON public.wallets
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallet_transactions_manage_admin" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_manage_admin" ON public.wallet_transactions
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_manage_admin" ON public.payments;
CREATE POLICY "payments_manage_admin" ON public.payments
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- BOOST PLANS & PROPERTY BOOSTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "boost_plans_select_active_public" ON public.boost_plans;
CREATE POLICY "boost_plans_select_active_public" ON public.boost_plans
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "boost_plans_manage_admin" ON public.boost_plans;
CREATE POLICY "boost_plans_manage_admin" ON public.boost_plans
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "property_boosts_select_own" ON public.property_boosts;
CREATE POLICY "property_boosts_select_own" ON public.property_boosts
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "property_boosts_manage_admin" ON public.property_boosts;
CREATE POLICY "property_boosts_manage_admin" ON public.property_boosts
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- CONTACT ACCESS PASSES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "contact_passes_select_own" ON public.contact_access_passes;
CREATE POLICY "contact_passes_select_own" ON public.contact_access_passes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contact_passes_manage_admin" ON public.contact_access_passes;
CREATE POLICY "contact_passes_manage_admin" ON public.contact_access_passes
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- ADVERTISING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "banner_requests_insert_authenticated" ON public.banner_requests;
CREATE POLICY "banner_requests_insert_authenticated" ON public.banner_requests
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "banner_requests_select_own" ON public.banner_requests;
CREATE POLICY "banner_requests_select_own" ON public.banner_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "banner_requests_manage_admin" ON public.banner_requests;
CREATE POLICY "banner_requests_manage_admin" ON public.banner_requests
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "promo_banners_select_active_public" ON public.promo_banners;
CREATE POLICY "promo_banners_select_active_public" ON public.promo_banners
  FOR SELECT USING (is_active = TRUE AND NOW() BETWEEN start_date AND end_date);

DROP POLICY IF EXISTS "promo_banners_manage_admin" ON public.promo_banners;
CREATE POLICY "promo_banners_manage_admin" ON public.promo_banners
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- CMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "site_pages_select_published_public" ON public.site_pages;
CREATE POLICY "site_pages_select_published_public" ON public.site_pages
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "site_pages_manage_admin" ON public.site_pages;
CREATE POLICY "site_pages_manage_admin" ON public.site_pages
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "site_categories_select_public" ON public.site_categories;
CREATE POLICY "site_categories_select_public" ON public.site_categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "seo_guides_select_published_public" ON public.seo_guides;
CREATE POLICY "seo_guides_select_published_public" ON public.seo_guides
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "seo_guides_manage_admin" ON public.seo_guides;
CREATE POLICY "seo_guides_manage_admin" ON public.seo_guides
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_manage_admin" ON public.notifications;
CREATE POLICY "notifications_manage_admin" ON public.notifications
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- AUTHENTICATION POLICIES
-- =====================================================

DROP POLICY IF EXISTS "otp_attempts_manage_rpc_only" ON public.otp_attempts;
CREATE POLICY "otp_attempts_manage_rpc_only" ON public.otp_attempts
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "sms_logs_select_own" ON public.sms_logs;
CREATE POLICY "sms_logs_select_own" ON public.sms_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sms_logs_select_admin" ON public.sms_logs;
CREATE POLICY "sms_logs_select_admin" ON public.sms_logs
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- ADMIN TABLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "admin_audit_logs_select_admin" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_select_admin" ON public.admin_audit_logs
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "admin_notifications_select_admin" ON public.admin_notifications;
CREATE POLICY "admin_notifications_select_admin" ON public.admin_notifications
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "admin_notifications_update_admin" ON public.admin_notifications;
CREATE POLICY "admin_notifications_update_admin" ON public.admin_notifications
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- MONITORING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "system_logs_select_admin" ON public.system_logs;
CREATE POLICY "system_logs_select_admin" ON public.system_logs
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "performance_metrics_select_admin" ON public.performance_metrics;
CREATE POLICY "performance_metrics_select_admin" ON public.performance_metrics
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "analytics_events_select_admin" ON public.analytics_events;
CREATE POLICY "analytics_events_select_admin" ON public.analytics_events
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "alert_configurations_manage_admin" ON public.alert_configurations;
CREATE POLICY "alert_configurations_manage_admin" ON public.alert_configurations
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

DROP POLICY IF EXISTS "alert_history_select_admin" ON public.alert_history;
CREATE POLICY "alert_history_select_admin" ON public.alert_history
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- MEDIA POLICIES
-- =====================================================

DROP POLICY IF EXISTS "media_select_own" ON public.media;
CREATE POLICY "media_select_own" ON public.media
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "media_insert_own" ON public.media;
CREATE POLICY "media_insert_own" ON public.media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "media_delete_own" ON public.media;
CREATE POLICY "media_delete_own" ON public.media
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "media_manage_admin" ON public.media;
CREATE POLICY "media_manage_admin" ON public.media
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- PLATFORM SETTINGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "platform_settings_select_public" ON public.platform_settings;
CREATE POLICY "platform_settings_select_public" ON public.platform_settings
  FOR SELECT USING (key = 'monetization');

DROP POLICY IF EXISTS "platform_settings_manage_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_manage_admin" ON public.platform_settings
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins WHERE is_active = TRUE));

-- =====================================================
-- EMAIL RESEND ATTEMPTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "email_resend_attempts_select_own" ON public.email_resend_attempts;
CREATE POLICY "email_resend_attempts_select_own" ON public.email_resend_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
