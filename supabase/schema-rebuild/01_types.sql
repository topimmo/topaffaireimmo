-- =====================================================
-- 01_types.sql - Custom Types and Enums
-- =====================================================
-- Creates all custom PostgreSQL types and enums
-- Run this FIRST before creating tables
-- =====================================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS user_type_enum CASCADE;
DROP TYPE IF EXISTS property_status_enum CASCADE;
DROP TYPE IF EXISTS transaction_type_enum CASCADE;
DROP TYPE IF EXISTS property_type_enum CASCADE;
DROP TYPE IF EXISTS announcer_type_enum CASCADE;
DROP TYPE IF EXISTS advertiser_type_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS boost_status_enum CASCADE;
DROP TYPE IF EXISTS request_status_enum CASCADE;
DROP TYPE IF EXISTS log_level_enum CASCADE;
DROP TYPE IF EXISTS metric_type_enum CASCADE;
DROP TYPE IF EXISTS analytics_event_type_enum CASCADE;
DROP TYPE IF EXISTS alert_type_enum CASCADE;
DROP TYPE IF EXISTS sms_provider_enum CASCADE;
DROP TYPE IF EXISTS sms_status_enum CASCADE;

-- Note: These type definitions are optional as the tables use TEXT with CHECK constraints
-- This file exists for documentation and potential future use of native PostgreSQL enums

COMMENT ON SCHEMA public IS 'TopAffaireImmo uses TEXT with CHECK constraints instead of ENUMs for flexibility';
