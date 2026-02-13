/**
 * Centralized route constants for the application
 * Use these constants instead of hardcoded strings to ensure consistency
 * and make it easier to refactor routes in the future
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  SEARCH: '/search',
  BUY: '/buy',
  RENT: '/rent',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  AGENCIES: '/agencies',
  ADVERTISE: '/advertise',
  GUIDES: '/guides',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  SELECT_ROLE: '/select-role',
  AUTH_CALLBACK: '/auth/callback',
  
  // Services
  SERVICES: '/services',
  SERVICE_DETAIL: (slug: string) => `/services/${slug}`,
  
  // Property routes
  PROPERTY_DETAIL: (id: string) => `/property/${id}`,
  ADD_LISTING: '/add-listing',
  EDIT_LISTING: (id: string) => `/edit-listing/${id}`,
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_ARTISAN: '/dashboard/artisan',
  
  // Artisan routes
  ARTISAN: {
    SERVICES: '/artisan/services',
    REQUESTS: '/artisan/requests',
    PENDING: '/artisan/pending',
    ONBOARDING: '/artisan/onboarding',
  },
  
  // Agent routes
  AGENT: '/agent',
  AGENT_DASHBOARD: '/agent',
  
  // Merchant routes
  MERCHANT: '/merchant',
  COMMERCIAL_DASHBOARD: '/commercial-dashboard',
  ADVERTISING: '/advertising',
  ADVERTISING_NEW: '/advertising/new',
  
  // Admin routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    LISTINGS: '/admin/listings',
    LISTING_DETAIL: (id: string) => `/admin/listings/${id}`,
    USERS: '/admin/users',
    AGENCIES: '/admin/agencies',
    LOCATIONS: '/admin/locations',
    SETTINGS: '/admin/settings',
    DIAGNOSTICS: '/admin/diagnostics',
    CONTENT: {
      PAGES: '/admin/content/pages',
      CATEGORIES: '/admin/content/categories',
    },
    PROMO_BANNERS: '/admin/promo-banners',
    DUMMY_PROPERTIES: '/admin/dummy-properties',
    MONETIZATION: '/admin/monetization',
    SERVICES: {
      CATEGORIES: '/admin/services/categories',
      SUBCATEGORIES: '/admin/services/subcategories',
      REQUESTS: '/admin/services/requests',
    },
    ARTISANS: '/admin/artisans',
  },
  
  // City routes (SEO)
  CITY: (city: string) => `/${city}`,
  IMMOBILIER_CITY: (city: string) => `/immobilier/${city}`,
  
  // Guide routes
  GUIDE_DETAIL: (slug: string) => `/guides/${slug}`,
} as const;

/**
 * Get the redirect path based on user role
 */
export function getRoleRedirect(role: 'user' | 'agent' | 'merchant' | 'admin'): string {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.ROOT;
    case 'merchant':
      return ROUTES.MERCHANT;
    case 'agent':
      return ROUTES.AGENT;
    case 'user':
    default:
      return ROUTES.DASHBOARD;
  }
}

/**
 * Check if a path is a public route (doesn't require authentication)
 */
export function isPublicRoute(path: string): boolean {
  const publicPaths = [
    ROUTES.HOME,
    ROUTES.SEARCH,
    ROUTES.BUY,
    ROUTES.RENT,
    ROUTES.ABOUT,
    ROUTES.CONTACT,
    ROUTES.PRIVACY,
    ROUTES.TERMS,
    ROUTES.AGENCIES,
    ROUTES.ADVERTISE,
    ROUTES.GUIDES,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.RESET_PASSWORD,
    ROUTES.AUTH_CALLBACK,
    ROUTES.SERVICES,
  ];
  
  // Exact match
  if (publicPaths.includes(path)) {
    return true;
  }
  
  // Pattern match for dynamic routes
  if (path.startsWith('/services/') || 
      path.startsWith('/property/') || 
      path.startsWith('/guides/') ||
      path.match(/^\/[^\/]+\/(buy|rent|villa|apartment)/)) {
    return true;
  }
  
  return false;
}
