export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          notification_type: string | null
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          notification_type?: string | null
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          notification_type?: string | null
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_whitelist: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_active?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_active?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      advertising_inquiries: {
        Row: {
          advertiser_type: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_type?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_type?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artisan_service_zones: {
        Row: {
          city_slug: string
          created_at: string
          id: string
          is_primary: boolean | null
          neighborhood_slugs: string[] | null
          updated_at: string
          user_id: string
          zone_slug: string | null
        }
        Insert: {
          city_slug: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          neighborhood_slugs?: string[] | null
          updated_at?: string
          user_id: string
          zone_slug?: string | null
        }
        Update: {
          city_slug?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          neighborhood_slugs?: string[] | null
          updated_at?: string
          user_id?: string
          zone_slug?: string | null
        }
        Relationships: []
      }
      banner_requests: {
        Row: {
          admin_notes: string | null
          advertiser_id: string
          alt_text_ar: string | null
          alt_text_fr: string | null
          approved_at: string | null
          approved_by: string | null
          banner_image_url: string
          clicks: number | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          duration_days: number
          end_date: string | null
          id: string
          impressions: number | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          price: number
          slot_id: number
          start_date: string | null
          status: string | null
          target_url: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          advertiser_id: string
          alt_text_ar?: string | null
          alt_text_fr?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_image_url: string
          clicks?: number | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          duration_days: number
          end_date?: string | null
          id?: string
          impressions?: number | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          price: number
          slot_id: number
          start_date?: string | null
          status?: string | null
          target_url: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          advertiser_id?: string
          alt_text_ar?: string | null
          alt_text_fr?: string | null
          approved_at?: string | null
          approved_by?: string | null
          banner_image_url?: string
          clicks?: number | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          duration_days?: number
          end_date?: string | null
          id?: string
          impressions?: number | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          price?: number
          slot_id?: number
          start_date?: string | null
          status?: string | null
          target_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_requests_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_requests_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "banner_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_slots: {
        Row: {
          allowed_formats: string[] | null
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          max_file_size: number | null
          name_ar: string
          name_fr: string
          page: string
          position: string
          price_per_day: number
          price_per_month: number | null
          price_per_week: number | null
          size: string
        }
        Insert: {
          allowed_formats?: string[] | null
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          max_file_size?: number | null
          name_ar: string
          name_fr: string
          page: string
          position: string
          price_per_day: number
          price_per_month?: number | null
          price_per_week?: number | null
          size: string
        }
        Update: {
          allowed_formats?: string[] | null
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          max_file_size?: number | null
          name_ar?: string
          name_fr?: string
          page?: string
          position?: string
          price_per_day?: number
          price_per_month?: number | null
          price_per_week?: number | null
          size?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          name_ar: string
          name_fr: string
          region_ar: string | null
          region_fr: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name_ar: string
          name_fr: string
          region_ar?: string | null
          region_fr?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          name_ar?: string
          name_fr?: string
          region_ar?: string | null
          region_fr?: string | null
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          city_id: number
          created_at: string | null
          created_by: string | null
          id: number
          is_custom: boolean | null
          name_ar: string
          name_fr: string
          slug: string
        }
        Insert: {
          city_id: number
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_custom?: boolean | null
          name_ar: string
          name_fr: string
          slug: string
        }
        Update: {
          city_id?: number
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_custom?: boolean | null
          name_ar?: string
          name_fr?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_attempts: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          last_sent_at: string
          locked_until: string | null
          otp_hash: string
          phone: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          last_sent_at?: string
          locked_until?: string | null
          otp_hash: string
          phone: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          locked_until?: string | null
          otp_hash?: string
          phone?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          banner_request_id: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          banner_request_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          banner_request_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_banner_request_id_fkey"
            columns: ["banner_request_id"]
            isOneToOne: false
            referencedRelation: "banner_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          advertiser_type: string | null
          agency_cities: string[] | null
          agency_description_ar: string | null
          agency_description_fr: string | null
          agency_license: string | null
          agency_logo: string | null
          agency_name: string | null
          company_name: string | null
          company_website: string | null
          created_at: string | null
          email: string
          full_name: string | null
          google_id: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_verified: boolean | null
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
          user_role: string
          user_type: string | null
        }
        Insert: {
          advertiser_type?: string | null
          agency_cities?: string[] | null
          agency_description_ar?: string | null
          agency_description_fr?: string | null
          agency_license?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          google_id?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_role?: string
          user_type?: string | null
        }
        Update: {
          advertiser_type?: string | null
          agency_cities?: string[] | null
          agency_description_ar?: string | null
          agency_description_fr?: string | null
          agency_license?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          google_id?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_role?: string
          user_type?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          advertiser_type: string
          amenities: Json | null
          approved_at: string | null
          approved_by: string | null
          area: number | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          city_id: number
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string | null
          created_by: string | null
          custom_neighborhood: string | null
          description: string | null
          description_ar: string | null
          description_fr: string | null
          external_key: string | null
          featured: boolean | null
          featured_rank: number | null
          features: Json | null
          floor_number: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_archived: boolean
          is_dummy: boolean | null
          is_featured: boolean | null
          is_sample: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          neighborhood_id: number | null
          owner_id: string
          price: number
          property_type: string
          property_type_id: number | null
          published_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          show_email_public: boolean
          show_phone_public: boolean
          show_whatsapp_public: boolean
          status: string | null
          title: string | null
          title_ar: string
          title_fr: string
          total_floors: number | null
          transaction_type: string
          updated_at: string | null
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          advertiser_type?: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          area?: number | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          city_id: number
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_neighborhood?: string | null
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          external_key?: string | null
          featured?: boolean | null
          featured_rank?: number | null
          features?: Json | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_archived?: boolean
          is_dummy?: boolean | null
          is_featured?: boolean | null
          is_sample?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          neighborhood_id?: number | null
          owner_id: string
          price: number
          property_type: string
          property_type_id?: number | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          show_email_public?: boolean
          show_phone_public?: boolean
          show_whatsapp_public?: boolean
          status?: string | null
          title?: string | null
          title_ar: string
          title_fr: string
          total_floors?: number | null
          transaction_type: string
          updated_at?: string | null
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          advertiser_type?: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          area?: number | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          city_id?: number
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_neighborhood?: string | null
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          external_key?: string | null
          featured?: boolean | null
          featured_rank?: number | null
          features?: Json | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_archived?: boolean
          is_dummy?: boolean | null
          is_featured?: boolean | null
          is_sample?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          neighborhood_id?: number | null
          owner_id?: string
          price?: number
          property_type?: string
          property_type_id?: number | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          show_email_public?: boolean
          show_phone_public?: boolean
          show_whatsapp_public?: boolean
          status?: string | null
          title?: string | null
          title_ar?: string
          title_fr?: string
          total_floors?: number | null
          transaction_type?: string
          updated_at?: string | null
          views_count?: number | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_contact_clicks: {
        Row: {
          contact_type: string
          created_at: string | null
          id: string
          ip_address: unknown
          property_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          property_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          property_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_contact_clicks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contact_clicks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          property_id: string
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          property_id: string
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          property_id?: string
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      property_leads: {
        Row: {
          advertiser_id: string
          advertiser_notes: string | null
          contacted_at: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          property_id: string
          source: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          advertiser_id: string
          advertiser_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          property_id: string
          source?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          advertiser_id?: string
          advertiser_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string
          source?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          code: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: number
          is_active: boolean | null
          name_ar: string
          name_fr: string
        }
        Insert: {
          code: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name_ar: string
          name_fr: string
        }
        Update: {
          code?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name_ar?: string
          name_fr?: string
        }
        Relationships: []
      }
      property_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          property_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          property_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          property_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_fr: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_fr: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_fr: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_fr?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      service_provider_payments: {
        Row: {
          admin_note: string | null
          amount_mad: number
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          method: string
          plan: string
          proof_url: string | null
          provider_id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_mad: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          method: string
          plan: string
          proof_url?: string | null
          provider_id: string
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_mad?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          method?: string
          plan?: string
          proof_url?: string | null
          provider_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_portfolio_images: {
        Row: {
          created_at: string
          id: string
          image_path: string
          provider_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          provider_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          provider_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_portfolio_images_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_provider_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_profiles: {
        Row: {
          active_until: string | null
          bio_ar: string | null
          bio_fr: string | null
          cities: string[]
          created_at: string
          display_name: string
          id: string
          neighborhoods: string[]
          phone: string | null
          service_category_id: string | null
          updated_at: string
          user_id: string
          visibility_status: string
          whatsapp: string | null
        }
        Insert: {
          active_until?: string | null
          bio_ar?: string | null
          bio_fr?: string | null
          cities?: string[]
          created_at?: string
          display_name: string
          id?: string
          neighborhoods?: string[]
          phone?: string | null
          service_category_id?: string | null
          updated_at?: string
          user_id: string
          visibility_status?: string
          whatsapp?: string | null
        }
        Update: {
          active_until?: string | null
          bio_ar?: string | null
          bio_fr?: string | null
          cities?: string[]
          created_at?: string
          display_name?: string
          id?: string
          neighborhoods?: string[]
          phone?: string | null
          service_category_id?: string | null
          updated_at?: string
          user_id?: string
          visibility_status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_profiles_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_fr: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_fr: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_fr: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_fr?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content_ar: string
          content_fr: string
          created_at: string
          id: string
          is_published: boolean | null
          meta_description_ar: string | null
          meta_description_fr: string | null
          slug: string
          title_ar: string
          title_fr: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_ar: string
          content_fr: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description_ar?: string | null
          meta_description_fr?: string | null
          slug: string
          title_ar: string
          title_fr: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_ar?: string
          content_fr?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description_ar?: string | null
          meta_description_fr?: string | null
          slug?: string
          title_ar?: string
          title_fr?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description_ar: string | null
          description_fr: string | null
          id: number
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
          value_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: number
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
          value_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: number
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      properties_public: {
        Row: {
          address: string | null
          advertiser_type: string | null
          amenities: Json | null
          approved_at: string | null
          approved_by: string | null
          area: number | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          city_id: number | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string | null
          created_by: string | null
          custom_neighborhood: string | null
          description: string | null
          description_ar: string | null
          description_fr: string | null
          external_key: string | null
          featured: boolean | null
          featured_rank: number | null
          features: Json | null
          floor_number: number | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          is_archived: boolean | null
          is_dummy: boolean | null
          is_featured: boolean | null
          is_sample: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          neighborhood_id: number | null
          owner_id: string | null
          price: number | null
          property_type: string | null
          property_type_id: number | null
          published_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          show_email_public: boolean | null
          show_phone_public: boolean | null
          show_whatsapp_public: boolean | null
          status: string | null
          title: string | null
          title_ar: string | null
          title_fr: string | null
          total_floors: number | null
          transaction_type: string | null
          updated_at: string | null
          views_count: number | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          advertiser_type?: string | null
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          area?: number | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          city_id?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_neighborhood?: string | null
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          external_key?: string | null
          featured?: boolean | null
          featured_rank?: number | null
          features?: Json | null
          floor_number?: number | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_dummy?: boolean | null
          is_featured?: boolean | null
          is_sample?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          neighborhood_id?: number | null
          owner_id?: string | null
          price?: number | null
          property_type?: string | null
          property_type_id?: number | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          show_email_public?: boolean | null
          show_phone_public?: boolean | null
          show_whatsapp_public?: boolean | null
          status?: string | null
          title?: string | null
          title_ar?: string | null
          title_fr?: string | null
          total_floors?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          views_count?: number | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          advertiser_type?: string | null
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          area?: number | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          city_id?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_neighborhood?: string | null
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          external_key?: string | null
          featured?: boolean | null
          featured_rank?: number | null
          features?: Json | null
          floor_number?: number | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_dummy?: boolean | null
          is_featured?: boolean | null
          is_sample?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          neighborhood_id?: number | null
          owner_id?: string | null
          price?: number | null
          property_type?: string | null
          property_type_id?: number | null
          published_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          show_email_public?: boolean | null
          show_phone_public?: boolean | null
          show_whatsapp_public?: boolean | null
          status?: string | null
          title?: string | null
          title_ar?: string | null
          title_fr?: string | null
          total_floors?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          views_count?: number | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_insert_property: { Args: { user_id: string }; Returns: boolean }
      check_user_role: {
        Args: { allowed_roles: string[]; user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      user_role_enum: "user" | "agent" | "merchant" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role_enum: ["user", "agent", "merchant", "admin"],
    },
  },
} as const
