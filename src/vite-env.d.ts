/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_WHATSAPP_NUMBER?: string
  readonly VERCEL_GIT_COMMIT_SHA?: string
  readonly GITHUB_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
