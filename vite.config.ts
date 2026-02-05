import path from "path";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

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
    // Sentry plugin for source maps (only in production builds with auth token)
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG || "topaffaireimmo",
      project: process.env.SENTRY_PROJECT || "topaffaireimmo-web",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: "./dist/**",
      },
      telemetry: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // We'll handle registration manually to add bot detection
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      
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

      // Inject manifest options (for custom service worker)
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Don't inject into the service worker since we handle it manually
        injectionPoint: undefined,
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
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? true : false, // Enable source maps for Sentry
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          
          // UI library chunks
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
          ],
          
          // Form handling
          forms: [
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
          
          // Icons and animations
          ui: [
            "lucide-react",
            "framer-motion",
          ],
          
          // Charts (only loaded in admin/analytics)
          charts: [
            "recharts",
          ],
          
          // Error monitoring (Sentry)
          monitoring: [
            "@sentry/react",
          ],
        },
      },
    },
  },
});
