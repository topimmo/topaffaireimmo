-- =====================================================
-- 03_indexes.sql - Performance Indexes
-- =====================================================
-- Creates all performance indexes for query optimization
-- =====================================================

-- =====================================================
-- PROFILE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- =====================================================
-- ADMIN INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- =====================================================
-- LOCATION INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON public.neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON public.neighborhoods(slug);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_is_custom ON public.neighborhoods(is_custom);

-- =====================================================
-- PROPERTY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON public.properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type ON public.properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured) WHERE featured = TRUE;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_city_status_price ON public.properties(city_id, status, price);
CREATE INDEX IF NOT EXISTS idx_properties_status_city_type ON public.properties(status, city_id, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status_created ON public.properties(status, created_at DESC);

-- Full-text search indexes using pg_trgm
CREATE INDEX IF NOT EXISTS idx_properties_title_fr_trgm ON public.properties USING gin(title_fr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_title_ar_trgm ON public.properties USING gin(title_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_description_fr_trgm ON public.properties USING gin(description_fr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_description_ar_trgm ON public.properties USING gin(description_ar gin_trgm_ops);

-- Property Images indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON public.property_images(property_id, display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON public.property_images(property_id, is_primary) WHERE is_primary = TRUE;

-- =====================================================
-- SERVICE CATEGORY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON public.service_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_categories_sort_order ON public.service_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_service_subcategories_category ON public.service_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_service_subcategories_slug ON public.service_subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_service_subcategories_active ON public.service_subcategories(is_active) WHERE is_active = TRUE;

-- =====================================================
-- ARTISAN INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_user_id ON public.artisan_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_service_category ON public.artisan_profiles(service_category_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_active ON public.artisan_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_verified ON public.artisan_profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_boosted ON public.artisan_profiles(is_boosted) WHERE is_boosted = TRUE;
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_cities ON public.artisan_profiles USING GIN(cities);

-- Artisan Profile Neighborhoods indexes
CREATE INDEX IF NOT EXISTS idx_artisan_profile_neighborhoods_artisan ON public.artisan_profile_neighborhoods(artisan_profile_id);
CREATE INDEX IF NOT EXISTS idx_artisan_profile_neighborhoods_neighborhood ON public.artisan_profile_neighborhoods(neighborhood_id);

-- Artisan Services indexes
CREATE INDEX IF NOT EXISTS idx_artisan_services_artisan ON public.artisan_services(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_services_category ON public.artisan_services(category_id);
CREATE INDEX IF NOT EXISTS idx_artisan_services_subcategory ON public.artisan_services(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_artisan_services_city ON public.artisan_services(city);
CREATE INDEX IF NOT EXISTS idx_artisan_services_active ON public.artisan_services(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_artisan_services_status ON public.artisan_services(status);
CREATE INDEX IF NOT EXISTS idx_artisan_services_approved_at ON public.artisan_services(approved_at) WHERE approved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artisan_services_moderated_at ON public.artisan_services(moderated_at) WHERE moderated_at IS NOT NULL;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_artisan_services_search ON public.artisan_services(category_id, city, is_active);
CREATE INDEX IF NOT EXISTS idx_artisan_services_status_created ON public.artisan_services(status, created_at) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_artisan_services_pending ON public.artisan_services(status, created_at) WHERE status = 'pending';

-- =====================================================
-- REQUEST INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_requests_client ON public.requests(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_artisan ON public.requests(artisan_profile_id, status, created_at DESC) WHERE artisan_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_service_city ON public.requests(service_category_id, city_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_unviewed ON public.requests(artisan_profile_id, viewed_by_artisan_at) WHERE viewed_by_artisan_at IS NULL AND status = 'pending';

-- Request Status History indexes
CREATE INDEX IF NOT EXISTS idx_request_status_history_request ON public.request_status_history(request_id, created_at DESC);

-- =====================================================
-- REVIEW INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reviews_artisan ON public.reviews(artisan_profile_id, created_at DESC) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_rating ON public.reviews(artisan_profile_id, rating DESC, created_at DESC) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_client ON public.reviews(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_request ON public.reviews(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON public.reviews(is_flagged, created_at DESC) WHERE is_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_unverified ON public.reviews(is_verified, created_at DESC) WHERE is_verified = FALSE;

-- =====================================================
-- MONETIZATION INDEXES
-- =====================================================

-- Wallet Transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reason ON public.wallet_transactions(reason);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Boost Plans indexes
CREATE INDEX IF NOT EXISTS idx_boost_plans_active ON public.boost_plans(is_active, display_order) WHERE is_active = TRUE;

-- Property Boosts indexes
CREATE INDEX IF NOT EXISTS idx_property_boosts_property ON public.property_boosts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_boosts_status ON public.property_boosts(status);
CREATE INDEX IF NOT EXISTS idx_property_boosts_active ON public.property_boosts(status, ends_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_property_boosts_dates ON public.property_boosts(starts_at, ends_at);

-- Phone Reveal Events indexes
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_entity ON public.phone_reveal_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_phone_reveal_events_created_at ON public.phone_reveal_events(created_at DESC);

-- Contact Access Passes indexes
CREATE INDEX IF NOT EXISTS idx_contact_passes_user_id ON public.contact_access_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_passes_expires_at ON public.contact_access_passes(expires_at);
CREATE INDEX IF NOT EXISTS idx_contact_passes_lookup ON public.contact_access_passes(user_id, city_id, service_category_id, expires_at);

-- =====================================================
-- ADVERTISING INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_banner_requests_status ON public.banner_requests(status);
CREATE INDEX IF NOT EXISTS idx_banner_requests_created_at ON public.banner_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promo_banners_active ON public.promo_banners(is_active, placement, display_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promo_banners_dates ON public.promo_banners(start_date, end_date);

-- =====================================================
-- CMS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON public.site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_published ON public.site_pages(is_published) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_site_categories_slug ON public.site_categories(slug);
CREATE INDEX IF NOT EXISTS idx_site_categories_sort_order ON public.site_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_seo_guides_slug ON public.seo_guides(slug);
CREATE INDEX IF NOT EXISTS idx_seo_guides_category ON public.seo_guides(category);
CREATE INDEX IF NOT EXISTS idx_seo_guides_published ON public.seo_guides(is_published) WHERE is_published = TRUE;

-- =====================================================
-- NOTIFICATION INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- =====================================================
-- AUTHENTICATION INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_otp_attempts_phone ON public.otp_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_expires_at ON public.otp_attempts(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_verified ON public.otp_attempts(verified) WHERE verified = FALSE;

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

-- =====================================================
-- ADMIN INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- =====================================================
-- MONITORING INDEXES
-- =====================================================

-- System Logs indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_correlation_id ON public.system_logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created ON public.system_logs(level, created_at DESC);

-- Performance Metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON public.performance_metrics(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_slow ON public.performance_metrics(metric_type, duration_ms) WHERE duration_ms > 500;

-- Analytics Events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON public.analytics_events(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events(event_type, created_at DESC);

-- Alert History indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_config ON public.alert_history(alert_config_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON public.alert_history(created_at DESC);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

-- Email Resend Attempts indexes
CREATE INDEX IF NOT EXISTS idx_email_resend_attempts_user_id ON public.email_resend_attempts(user_id, created_at DESC);

-- =====================================================
-- END OF INDEXES
-- =====================================================
