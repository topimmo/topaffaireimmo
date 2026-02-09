import path from "path";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

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
    sourcemap: false, // Disable source maps (Sentry removed)
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
        },
      },
    },
  },
});
