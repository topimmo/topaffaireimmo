// Auto-generated TypeScript types for TopAffaireImmo Supabase database
// Generated from migrations 001-076
// Last updated: 2026-02-05

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// CORE USER TABLES
// ============================================================================

export interface Profile {
  id: string // UUID
  email: string
  full_name: string | null
  phone: string | null
  
  // Roles
  user_role: 'admin' | 'real_estate_advertiser' | 'commercial_advertiser'
  
  // For real estate advertisers
  advertiser_type?: 'owner' | 'broker' | 'agency' | null
  agency_name?: string | null
  agency_logo?: string | null
  agency_description_fr?: string | null
  agency_description_ar?: string | null
  agency_cities?: string[] | null
  agency_license?: string | null
  
  // Commercial advertiser fields
  company_name?: string | null
  company_website?: string | null
  
  // Settings
  preferred_language: 'fr' | 'ar'
  is_verified: boolean
  is_active: boolean
  is_admin?: boolean | null // Deprecated, use admins table
  
  created_at: string // timestamp
  updated_at: string // timestamp
}

// ============================================================================
// PROPERTY TABLES
// ============================================================================

export interface Property {
  id: string // UUID
  owner_id: string // UUID
  created_by: string // UUID - immutable original creator
  
  // Classification
  transaction_type: 'sale' | 'rent'
  property_type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land'
  property_type_id?: number | null
  advertiser_type: 'owner' | 'broker' | 'agency'
  
  // Location
  city_id: number
  neighborhood_id?: number | null
  custom_neighborhood?: string | null
  address?: string | null
  
  // Details
  price: number
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_number?: number | null
  total_floors?: number | null
  year_built?: number | null
  
  // Multilingual content
  title_fr: string
  title_ar: string
  title_en?: string | null
  description_fr?: string | null
  description_ar?: string | null
  description_en?: string | null
  
  // Features & images
  features?: Json | null
  amenities?: Json | null
  images?: string[] | Json | null
  
  // Contact
  phone?: string | null
  contact_phone?: string | null
  contact_whatsapp?: string | null
  contact_email?: string | null
  
  // Status workflow
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'archived' | 'sold' | 'rented' | 'inactive'
  rejection_reason?: string | null
  
  // Admin tracking
  moderated_at?: string | null
  moderated_by?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  rejected_by?: string | null
  
  // Featured properties
  featured: boolean
  is_featured?: boolean | null
  featured_until?: string | null
  featured_rank?: number | null
  
  // Sample/demo listings
  is_sample?: boolean | null
  external_key?: string | null // unique when not null
  
  // Stats
  views_count?: number | null
  favorites_count?: number | null
  
  // Archive flag
  is_archived?: boolean | null
  
  // Dates
  created_at: string
  updated_at: string
  expires_at?: string | null
}

export interface PropertyImage {
  id: string // UUID
  property_id: string // UUID
  image_url?: string | null
  url?: string | null
  storage_path?: string | null
  thumbnail_url?: string | null
  alt_text_fr?: string | null
  alt_text_ar?: string | null
  sort_order?: number | null
  is_primary?: boolean | null
  display_order?: number | null
  created_at: string
}

// ============================================================================
// REFERENCE DATA TABLES
// ============================================================================

export interface City {
  id: number
  name_en?: string | null
  name_fr: string
  name_ar: string
  slug?: string | null
  region_en?: string | null
  region_fr?: string | null
  region_ar?: string | null
  latitude?: number | null
  longitude?: number | null
  is_active?: boolean | null
  display_order?: number | null
  sort_order?: number | null
  created_at?: string | null
}

export interface Neighborhood {
  id: number
  city_id: number
  name_en?: string | null
  name_fr: string
  name_ar: string
  slug: string // URL-friendly slug for SEO
  is_custom?: boolean | null
  is_active?: boolean | null
  created_by?: string | null // UUID
  created_at?: string | null
}

export interface PropertyType {
  id: number
  code: string // unique
  name_en?: string | null
  name_fr: string
  name_ar: string
  icon?: string | null
  is_active?: boolean | null
  sort_order?: number | null
  display_order?: number | null
  created_at?: string | null
}

// ============================================================================
// COMMERCIAL ADVERTISING SYSTEM
// ============================================================================

export interface BannerSlot {
  id: number
  code: string // unique
  name_en?: string | null
  name_fr: string
  name_ar: string
  page: string
  position: string
  size: string
  width?: number | null
  height?: number | null
  price_per_day?: number | null
  price_per_week?: number | null
  price_per_month?: number | null
  description_en?: string | null
  description_fr?: string | null
  description_ar?: string | null
  is_active?: boolean | null
  max_file_size?: number | null
  allowed_formats?: string[] | null
  created_at?: string | null
}

export interface BannerRequest {
  id: string // UUID
  advertiser_id: string // UUID
  slot_id: number
  
  // Advertiser info
  company_name: string
  contact_email: string
  contact_phone?: string | null
  website_url?: string | null
  
  // Banner details
  banner_image_url: string
  target_url: string
  alt_text_en?: string | null
  alt_text_fr?: string | null
  alt_text_ar?: string | null
  
  // Duration & pricing
  duration_days: number
  price: number
  
  // Payment
  payment_method?: 'bank_transfer' | 'cash' | 'mobile_payment' | 'check' | null
  payment_proof_url?: string | null
  payment_reference?: string | null
  payment_status?: 'pending' | 'received' | 'verified' | 'refunded' | null
  
  // Status workflow
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'expired' | 'cancelled'
  admin_notes?: string | null
  rejection_reason?: string | null
  
  // Admin tracking
  approved_by?: string | null
  approved_at?: string | null
  
  // Dates
  start_date?: string | null
  end_date?: string | null
  
  // Analytics
  impressions?: number | null
  clicks?: number | null
  
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string // UUID
  user_id: string // UUID
  banner_request_id?: string | null
  
  amount: number
  currency?: string | null
  
  payment_method: 'bank_transfer' | 'cash' | 'check' | 'mobile_payment'
  payment_reference?: string | null
  receipt_url?: string | null
  
  status: 'pending' | 'completed' | 'confirmed' | 'failed' | 'refunded'
  
  description?: string | null
  notes?: string | null
  admin_notes?: string | null
  
  // Confirmation tracking
  confirmed_by?: string | null
  confirmed_at?: string | null
  verified_by?: string | null
  verified_at?: string | null
  
  created_at: string
  updated_at: string
}

export interface AdvertisingInquiry {
  id: string // UUID
  advertiser_type?: 'real_estate' | 'commercial' | null
  company_name?: string | null
  contact_name: string
  contact_email: string
  contact_phone?: string | null
  message: string
  status?: 'new' | 'contacted' | 'converted' | 'rejected' | null
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// ADMIN & CONTENT MANAGEMENT
// ============================================================================

export interface Admin {
  user_id: string // UUID primary key
  role?: string | null // 'admin'
  is_active?: boolean | null
  created_at: string
}

export interface AdminAuditLog {
  id: string // UUID
  created_at: string
  admin_id: string // UUID
  action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature' | 'update' | 'create' | 'bulk_action'
  entity_type: 'property' | 'user' | 'page' | 'category' | 'settings' | 'location' | 'other'
  entity_id?: string | null
  resource_type?: string | null
  metadata?: Json | null
}

export interface AdminNotification {
  id: string // UUID
  created_at: string
  title: string
  body: string
  read_at?: string | null
  user_id?: string | null // NULL for broadcast
  link?: string | null
  notification_type: 'info' | 'warning' | 'success' | 'error'
}

export interface SitePage {
  id: string // UUID
  slug: string // unique
  title_en?: string | null
  title_fr: string
  title_ar: string
  content_en?: string | null
  content_fr: string
  content_ar: string
  meta_description_en?: string | null
  meta_description_fr?: string | null
  meta_description_ar?: string | null
  is_published?: boolean | null
  created_at: string
  updated_at: string
  updated_by?: string | null
}

export interface SiteCategory {
  id: string // UUID
  slug: string // unique
  name_en?: string | null
  name_fr: string
  name_ar: string
  description_en?: string | null
  description_fr?: string | null
  description_ar?: string | null
  icon?: string | null
  sort_order?: number | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  id: number
  key: string // unique
  value?: string | null
  value_text?: string | null
  value_json?: Json | null
  value_type?: 'string' | 'number' | 'boolean' | 'json' | 'html' | null
  description_en?: string | null
  description_fr?: string | null
  description_ar?: string | null
  category?: string | null
  is_public?: boolean | null
  created_at?: string | null
  updated_at: string
  updated_by?: string | null
}

export interface PromoBanner {
  id: string // UUID
  title: string
  image_url: string
  link_url?: string | null
  position: 'home-top' | 'home-middle' | 'listing-top'
  is_active?: boolean | null
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  updated_at: string
}

export interface DummyProperty {
  id: string // UUID
  transaction_type: 'sale' | 'rent'
  property_type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land'
  city_id: number
  neighborhood_id?: number | null
  title_en?: string | null
  title_fr: string
  title_ar: string
  description_en?: string | null
  description_fr?: string | null
  description_ar?: string | null
  price: number
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  images?: string[] | null
  featured_rank?: number | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface PushSubscription {
  id: string // UUID
  user_id?: string | null // nullable for anonymous
  endpoint: string // unique
  p256dh: string
  auth: string
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

// ============================================================================
// HELPER TYPES FOR QUERIES
// ============================================================================

export interface PropertyWithRelations extends Property {
  city?: City
  neighborhood?: Neighborhood
  property_type_rel?: PropertyType
}

export interface PropertyFilters {
  transaction_type?: 'sale' | 'rent'
  property_type?: string
  city_id?: number
  neighborhood_id?: number
  min_price?: number
  max_price?: number
  bedrooms?: number
  min_area?: number
  max_area?: number
  status?: string
  featured?: boolean
  filters?: any
}

export interface AuditLogEntry {
  admin_id: string
  action: string
  entity_type: string
  entity_id?: string
  metadata?: Json
  resource_type?: string
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Property, 'id' | 'created_by'>>
      }
      property_images: {
        Row: PropertyImage
        Insert: Omit<PropertyImage, 'id' | 'created_at'>
        Update: Partial<Omit<PropertyImage, 'id'>>
      }
      cities: {
        Row: City
        Insert: Omit<City, 'id'>
        Update: Partial<Omit<City, 'id'>>
      }
      neighborhoods: {
        Row: Neighborhood
        Insert: Omit<Neighborhood, 'id'>
        Update: Partial<Omit<Neighborhood, 'id'>>
      }
      property_types: {
        Row: PropertyType
        Insert: Omit<PropertyType, 'id'>
        Update: Partial<Omit<PropertyType, 'id'>>
      }
      banner_slots: {
        Row: BannerSlot
        Insert: Omit<BannerSlot, 'id'>
        Update: Partial<Omit<BannerSlot, 'id'>>
      }
      banner_requests: {
        Row: BannerRequest
        Insert: Omit<BannerRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BannerRequest, 'id'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id'>>
      }
      advertising_inquiries: {
        Row: AdvertisingInquiry
        Insert: Omit<AdvertisingInquiry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AdvertisingInquiry, 'id'>>
      }
      admins: {
        Row: Admin
        Insert: Omit<Admin, 'created_at'>
        Update: Partial<Omit<Admin, 'user_id'>>
      }
      admin_audit_logs: {
        Row: AdminAuditLog
        Insert: Omit<AdminAuditLog, 'id' | 'created_at'>
        Update: never
      }
      admin_notifications: {
        Row: AdminNotification
        Insert: Omit<AdminNotification, 'id' | 'created_at'>
        Update: Partial<Omit<AdminNotification, 'id' | 'created_at'>>
      }
      site_pages: {
        Row: SitePage
        Insert: Omit<SitePage, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SitePage, 'id'>>
      }
      site_categories: {
        Row: SiteCategory
        Insert: Omit<SiteCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SiteCategory, 'id'>>
      }
      site_settings: {
        Row: SiteSetting
        Insert: Omit<SiteSetting, 'id' | 'updated_at'>
        Update: Partial<Omit<SiteSetting, 'id'>>
      }
      promo_banners: {
        Row: PromoBanner
        Insert: Omit<PromoBanner, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PromoBanner, 'id'>>
      }
      dummy_properties: {
        Row: DummyProperty
        Insert: Omit<DummyProperty, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DummyProperty, 'id'>>
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PushSubscription, 'id'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
