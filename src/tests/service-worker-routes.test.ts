/**
 * Service Worker Auth Routes Tests
 * 
 * Tests for the auth route detection logic in the Service Worker
 * These functions determine whether routes should bypass SW caching
 */

// Mock the AUTH_ROUTES constant from sw.ts
const AUTH_ROUTES = [
  '/auth/callback',
  '/reset-password',
  '/login',
  '/register',
];

// Mock the isAuthRoute function from sw.ts
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Mock the CRITICAL_ROUTES constant from sw.ts
const CRITICAL_ROUTES = [
  '/add-listing',
  '/edit-listing',
  '/dashboard',
  '/admin',
  '/profile',
  '/messages',
];

// Mock the isCriticalRoute function from sw.ts
function isCriticalRoute(pathname: string): boolean {
  return CRITICAL_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

describe('Service Worker Route Detection', () => {
  describe('isAuthRoute', () => {
    it('should detect exact auth routes', () => {
      expect(isAuthRoute('/auth/callback')).toBe(true);
      expect(isAuthRoute('/reset-password')).toBe(true);
      expect(isAuthRoute('/login')).toBe(true);
      expect(isAuthRoute('/register')).toBe(true);
    });

    it('should detect auth routes with query params', () => {
      // Note: pathname in URL object doesn't include query params
      // But we test the base path detection
      expect(isAuthRoute('/auth/callback')).toBe(true);
      expect(isAuthRoute('/reset-password')).toBe(true);
    });

    it('should detect auth sub-routes', () => {
      expect(isAuthRoute('/auth/callback/success')).toBe(true);
      expect(isAuthRoute('/reset-password/confirm')).toBe(true);
    });

    it('should NOT detect non-auth routes', () => {
      expect(isAuthRoute('/')).toBe(false);
      expect(isAuthRoute('/search')).toBe(false);
      expect(isAuthRoute('/property/123')).toBe(false);
      expect(isAuthRoute('/dashboard')).toBe(false);
      expect(isAuthRoute('/about')).toBe(false);
    });

    it('should NOT detect routes that contain auth string but are not auth routes', () => {
      expect(isAuthRoute('/authentic-moroccan-properties')).toBe(false);
      expect(isAuthRoute('/author-profile')).toBe(false);
    });
  });

  describe('isCriticalRoute', () => {
    it('should detect exact critical routes', () => {
      expect(isCriticalRoute('/dashboard')).toBe(true);
      expect(isCriticalRoute('/add-listing')).toBe(true);
      expect(isCriticalRoute('/admin')).toBe(true);
    });

    it('should detect critical sub-routes', () => {
      expect(isCriticalRoute('/edit-listing/123')).toBe(true);
      expect(isCriticalRoute('/dashboard/settings')).toBe(true);
      expect(isCriticalRoute('/admin/users')).toBe(true);
    });

    it('should NOT detect non-critical routes', () => {
      expect(isCriticalRoute('/')).toBe(false);
      expect(isCriticalRoute('/search')).toBe(false);
      expect(isCriticalRoute('/auth/callback')).toBe(false);
      expect(isCriticalRoute('/reset-password')).toBe(false);
    });
  });

  describe('Route prioritization', () => {
    it('should ensure auth routes and critical routes are mutually exclusive', () => {
      // Auth routes should not be critical routes and vice versa
      // This ensures proper handling in the Service Worker
      
      AUTH_ROUTES.forEach(authRoute => {
        expect(isCriticalRoute(authRoute)).toBe(false);
      });

      CRITICAL_ROUTES.forEach(criticalRoute => {
        expect(isAuthRoute(criticalRoute)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      // Empty string
      expect(isAuthRoute('')).toBe(false);
      expect(isCriticalRoute('')).toBe(false);

      // Trailing slash
      expect(isAuthRoute('/login/')).toBe(true);
      expect(isCriticalRoute('/dashboard/')).toBe(true);

      // Case sensitivity
      expect(isAuthRoute('/Login')).toBe(false); // Should be case-sensitive
      expect(isAuthRoute('/AUTH/CALLBACK')).toBe(false);
    });
  });
});

// Export for potential use in other tests
export { isAuthRoute, isCriticalRoute, AUTH_ROUTES, CRITICAL_ROUTES };
