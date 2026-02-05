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
