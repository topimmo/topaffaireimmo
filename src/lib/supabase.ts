import { createClient } from '@supabase/supabase-js'

// هذه القيم تأتي من متغيرات البيئة في Vercel أو .env
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
