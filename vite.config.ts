import path from "path";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

// Plugin to inject build timestamp and version into HTML
function buildMetadataPlugin(): Plugin {
  return {
    name: 'build-metadata',
    transformIndexHtml(html) {
      const timestamp = new Date().toISOString();
      const version = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 
                      process.env.npm_package_version || 
                      'local-dev';
      
      return html
        .replaceAll('BUILD_TIMESTAMP_PLACEHOLDER', timestamp)
        .replaceAll('DEPLOYMENT_VERSION_PLACEHOLDER', version);
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
