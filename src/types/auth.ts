/**
 * @fileoverview Authentication and Profile Type Definitions
 * 
 * Centralized type definitions for authentication and user profiles.
 * These types match the database schema and provide type safety throughout the app.
 * 
 * @see {@link /docs/DATABASE_SCHEMA.md} for complete schema documentation
 * @see {@link /docs/AUTH_ARCHITECTURE.md} for auth flow documentation
 */

/**
 * User role - controls system-wide permissions and access levels.
 * 
 * @description
 * - `user`: Regular user - can post listings, view properties
 * - `agent`: Real estate agent - can post listings, access agent dashboard
 * - `merchant`: Business account - can advertise, access merchant features
 * - `admin`: System administrator - full access to admin panel
 * 
 * @example
 * ```typescript
 * // Check role for authorization
 * if (profile.user_role === 'admin') {
 *   // Show admin controls
 * }
 * 
 * // Route protection
 * <ProtectedRoute allowedRoles={['agent', 'merchant']}>
 *   <AgentDashboard />
 * </ProtectedRoute>
 * ```
 */
export type UserRole = 'user' | 'agent' | 'merchant' | 'admin';

/**
 * Announcer type - categorizes real estate business model (French terminology).
 * 
 * @description
 * - `proprietaire`: Property owner posting their own property
 * - `courtier`: Real estate broker working with multiple properties
 * - `agence`: Real estate agency (company)
 * - `null`: For admins or non-real-estate users
 * 
 * @example
 * ```typescript
 * // Display on listing
 * const label = announcer_type === 'proprietaire' ? 'Propriétaire' : 'Agence';
 * 
 * // Filter listings
 * const { data } = await supabase
 *   .from('properties')
 *   .select('*')
 *   .eq('announcer_type', 'agence');
 * ```
 */
export type AnnouncerType = 'proprietaire' | 'courtier' | 'agence';

/**
 * Preferred language for user interface.
 * 
 * @description
 * - `fr`: French
 * - `ar`: Arabic
 * - `en`: English
 */
export type Language = 'fr' | 'ar' | 'en';

/**
 * User profile from the database.
 * 
 * @description
 * Represents a row from the `public.profiles` table.
 * Linked 1:1 with Supabase `auth.users` table via the `id` field.
 * 
 * @example
 * ```typescript
 * // Fetch user profile
 * const { data: profile } = await supabase
 *   .from('profiles')
 *   .select('*')
 *   .eq('id', userId)
 *   .single();
 * 
 * // Check if user is admin
 * const isAdmin = profile.user_role === 'admin';
 * 
 * // Display user info
 * <div>
 *   <h1>{profile.full_name}</h1>
 *   <p>{profile.email}</p>
 * </div>
 * ```
 * 
 * @see {@link /docs/DATABASE_SCHEMA.md} for complete field descriptions
 */
export interface Profile {
  /** UUID matching auth.users.id - single source of truth for user identity */
  id: string;
  
  /** User's email address (denormalized from auth.users for convenience) */
  email: string;
  
  /** User's full name */
  full_name: string | null;
  
  /** Phone number for contact */
  phone: string | null;
  
  /** Primary role - controls system permissions */
  user_role: UserRole;
  
  /** Secondary type - categorizes real estate business model */
  announcer_type: AnnouncerType | null;
  
  /** Name of the agency (for announcer_type = 'agence') */
  agency_name: string | null;
  
  /** URL to agency logo image */
  agency_logo: string | null;
  
  /** Agency description in French */
  agency_description_fr: string | null;
  
  /** Agency description in Arabic */
  agency_description_ar: string | null;
  
  /** Company name (for merchants) */
  company_name: string | null;
  
  /** Admin flag (prefer checking admins table + user_role) */
  is_admin: boolean;
  
  /** Account active status (false = suspended) */
  is_active: boolean;
  
  /** Email/phone verification status */
  is_verified: boolean;
  
  /** Google OAuth ID if signed up via Google */
  google_id: string | null;
  
  /** User's preferred language */
  preferred_language: Language;
  
  /** Profile creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Admin user record.
 * 
 * @description
 * Represents a row from the `public.admins` table.
 * Provides extra security layer for admin identification.
 * 
 * Admin status requires BOTH:
 * 1. profile.user_role === 'admin'
 * 2. Entry in admins table
 * 
 * @example
 * ```typescript
 * // Check if user is admin
 * const { data: adminRecord } = await supabase
 *   .from('admins')
 *   .select('user_id')
 *   .eq('user_id', userId)
 *   .maybeSingle();
 * 
 * const isAdmin = !!adminRecord && profile.user_role === 'admin';
 * ```
 */
export interface AdminRecord {
  /** User ID (references auth.users.id) */
  user_id: string;
  
  /** When admin access was granted */
  created_at: string;
}

/**
 * Input data for creating a new user profile.
 * 
 * @description
 * Used when signing up or manually creating a profile.
 * All fields are optional except email.
 * 
 * @example
 * ```typescript
 * const newProfile: ProfileCreateInput = {
 *   email: 'user@example.com',
 *   full_name: 'John Doe',
 *   user_role: 'agent',
 *   announcer_type: 'courtier',
 *   phone: '+212612345678'
 * };
 * ```
 */
export interface ProfileCreateInput {
  /** User ID (UUID from auth.users) */
  id: string;
  
  /** Email address */
  email: string;
  
  /** Full name (optional) */
  full_name?: string;
  
  /** Phone number (optional) */
  phone?: string;
  
  /** User role (defaults to 'user') */
  user_role?: UserRole;
  
  /** Announcer type (optional) */
  announcer_type?: AnnouncerType;
  
  /** Agency name (optional) */
  agency_name?: string;
  
  /** Company name (optional) */
  company_name?: string;
  
  /** Preferred language (defaults to 'fr') */
  preferred_language?: Language;
  
  /** Google OAuth ID (optional) */
  google_id?: string;
}

/**
 * Input data for updating an existing profile.
 * 
 * @description
 * All fields are optional. Only provided fields will be updated.
 * 
 * @example
 * ```typescript
 * const updates: ProfileUpdateInput = {
 *   full_name: 'New Name',
 *   phone: '+212612345678',
 *   preferred_language: 'ar'
 * };
 * 
 * await supabase
 *   .from('profiles')
 *   .update(updates)
 *   .eq('id', userId);
 * ```
 */
export interface ProfileUpdateInput {
  /** Full name */
  full_name?: string;
  
  /** Phone number */
  phone?: string;
  
  /** User role (admin only) */
  user_role?: UserRole;
  
  /** Announcer type */
  announcer_type?: AnnouncerType | null;
  
  /** Agency name */
  agency_name?: string | null;
  
  /** Agency logo URL */
  agency_logo?: string | null;
  
  /** Agency description (French) */
  agency_description_fr?: string | null;
  
  /** Agency description (Arabic) */
  agency_description_ar?: string | null;
  
  /** Company name */
  company_name?: string | null;
  
  /** Active status (admin only) */
  is_active?: boolean;
  
  /** Verified status (admin only) */
  is_verified?: boolean;
  
  /** Preferred language */
  preferred_language?: Language;
}

/**
 * Combined user data with auth and profile information.
 * 
 * @description
 * Combines Supabase Auth user with database profile.
 * Useful for components that need both authentication and profile data.
 * 
 * @example
 * ```typescript
 * const { user, profile } = useAuth();
 * 
 * const fullUser: UserWithProfile = {
 *   ...user,
 *   profile: profile
 * };
 * ```
 */
export interface UserWithProfile {
  /** Auth user data from Supabase */
  id: string;
  email: string;
  email_confirmed_at?: string;
  
  /** Profile data from database */
  profile: Profile | null;
}

/**
 * Auth state returned by useAuth hook.
 * 
 * @description
 * Represents the current authentication state in the application.
 * 
 * @example
 * ```typescript
 * const { user, session, loading, profileReady } = useAuth();
 * 
 * if (loading) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (!user || !profileReady) {
 *   return <LoginPrompt />;
 * }
 * 
 * return <Dashboard user={user} />;
 * ```
 */
export interface AuthState {
  /** Current authenticated user (null if not logged in) */
  user: any | null; // Supabase User type
  
  /** Current auth session with tokens (null if not logged in) */
  session: any | null; // Supabase Session type
  
  /** True while checking/restoring session (hydration) */
  loading: boolean;
  
  /** True when user profile verified in database */
  profileReady: boolean;
}

/**
 * Role combinations for route protection.
 * 
 * @description
 * Common role combinations for use with ProtectedRoute.
 * 
 * @example
 * ```typescript
 * // Protect route for real estate users only
 * <ProtectedRoute allowedRoles={REAL_ESTATE_ROLES}>
 *   <ListingsPage />
 * </ProtectedRoute>
 * ```
 */
export const ROLE_GROUPS = {
  /** All authenticated users */
  ALL_USERS: ['user', 'agent', 'merchant', 'admin'] as UserRole[],
  
  /** Real estate users (can post property listings) */
  REAL_ESTATE: ['user', 'agent', 'merchant'] as UserRole[],
  
  /** Business accounts (agents and merchants) */
  BUSINESS: ['agent', 'merchant'] as UserRole[],
  
  /** Admin only */
  ADMIN: ['admin'] as UserRole[],
} as const;

/**
 * Helper type guard to check if a role is valid.
 * 
 * @param role - Role string to check
 * @returns True if role is a valid UserRole
 * 
 * @example
 * ```typescript
 * const roleFromForm = formData.role;
 * 
 * if (isValidUserRole(roleFromForm)) {
 *   // TypeScript knows roleFromForm is UserRole here
 *   updateProfile({ user_role: roleFromForm });
 * }
 * ```
 */
export function isValidUserRole(role: string): role is UserRole {
  return ['user', 'agent', 'merchant', 'admin'].includes(role);
}

/**
 * Helper type guard to check if an announcer type is valid.
 * 
 * @param type - Type string to check
 * @returns True if type is a valid AnnouncerType
 * 
 * @example
 * ```typescript
 * const typeFromForm = formData.announcer_type;
 * 
 * if (isValidAnnouncerType(typeFromForm)) {
 *   // TypeScript knows typeFromForm is AnnouncerType here
 *   updateProfile({ announcer_type: typeFromForm });
 * }
 * ```
 */
export function isValidAnnouncerType(type: string): type is AnnouncerType {
  return ['proprietaire', 'courtier', 'agence'].includes(type);
}

/**
 * Helper function to get display name for user role.
 * 
 * @param role - User role
 * @param language - Display language
 * @returns Display name for the role
 * 
 * @example
 * ```typescript
 * const label = getUserRoleLabel(profile.user_role, 'fr');
 * // Returns: "Utilisateur" | "Agent" | "Commerçant" | "Administrateur"
 * ```
 */
export function getUserRoleLabel(role: UserRole, language: Language = 'fr'): string {
  const labels: Record<Language, Record<UserRole, string>> = {
    fr: {
      user: 'Utilisateur',
      agent: 'Agent',
      merchant: 'Commerçant',
      admin: 'Administrateur'
    },
    ar: {
      user: 'مستخدم',
      agent: 'وكيل',
      merchant: 'تاجر',
      admin: 'مدير'
    },
    en: {
      user: 'User',
      agent: 'Agent',
      merchant: 'Merchant',
      admin: 'Administrator'
    }
  };
  
  return labels[language][role];
}

/**
 * Helper function to get display name for announcer type.
 * 
 * @param type - Announcer type
 * @param language - Display language
 * @returns Display name for the type
 * 
 * @example
 * ```typescript
 * const label = getAnnouncerTypeLabel(profile.announcer_type, 'fr');
 * // Returns: "Propriétaire" | "Courtier" | "Agence"
 * ```
 */
export function getAnnouncerTypeLabel(type: AnnouncerType, language: Language = 'fr'): string {
  const labels: Record<Language, Record<AnnouncerType, string>> = {
    fr: {
      proprietaire: 'Propriétaire',
      courtier: 'Courtier',
      agence: 'Agence'
    },
    ar: {
      proprietaire: 'مالك',
      courtier: 'وسيط',
      agence: 'وكالة'
    },
    en: {
      proprietaire: 'Owner',
      courtier: 'Broker',
      agence: 'Agency'
    }
  };
  
  return labels[language][type];
}
