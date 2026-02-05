import path from "path";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// Plugin to inject build timestamp, version, and production domain into HTML
function buildMetadataPlugin(): Plugin {
  return {
    name: 'build-metadata',
    transformIndexHtml(html) {
      const timestamp = new Date().toISOString();
      const version = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 
                      process.env.GITHUB_SHA?.substring(0, 7) || 
                      'local';
      
      // Get production domain from environment, default to www.topaffaireimmo.com
      const productionDomain = process.env.VITE_PRODUCTION_DOMAIN || 
                               process.env.VITE_SITE_URL || 
                               'https://www.topaffaireimmo.com';
      
      return html
        .replaceAll('BUILD_TIMESTAMP_PLACEHOLDER', timestamp)
        .replaceAll('DEPLOYMENT_VERSION_PLACEHOLDER', version)
        // Replace all hardcoded Vercel URLs with production domain
        .replaceAll('https://topaffaireimmo.vercel.app', productionDomain);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
  },
  plugins: [
    react(),
    buildMetadataPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      // Manifest configuration
      manifest: {
        name: 'TopAffaireImmo',
        short_name: 'TopAffaireImmo',
        description: 'Plateforme immobilière de référence au Maroc. Trouvez des appartements, maisons, villas et propriétés commerciales à vendre ou à louer.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'lifestyle'],
        lang: 'fr-MA',
        dir: 'ltr'
      },

      // Include additional assets
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],

      // Workbox configuration
      workbox: {
        // Don't precache all assets - only critical ones
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache images (CacheFirst)
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Supabase Storage images (CacheFirst)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Supabase API calls (NetworkFirst) - EXCLUDE auth endpoints
            urlPattern: ({ url, request }) => {
              // Only cache GET requests
              if (request.method !== 'GET') return false;
              
              // Don't cache auth endpoints
              if (url.pathname.includes('/auth/')) return false;
              
              // Don't cache if has auth header (to avoid caching user-specific data)
              const hasAuthHeader = request.headers.has('Authorization') || 
                                   request.headers.has('apikey');
              if (hasAuthHeader) return false;
              
              // Cache Supabase REST API calls
              return url.hostname.includes('supabase.co') && 
                     url.pathname.includes('/rest/');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Fonts (CacheFirst)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Google Fonts static resources (CacheFirst)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // Offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [
          // Don't use offline page for API calls
          /^\/api\//,
          /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/
        ]
      },

      // Dev options (disable in production)
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
    host: process.env.TEMPO === "true" ? '0.0.0.0' : undefined,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
