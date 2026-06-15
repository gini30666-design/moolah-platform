import { createClient } from '@supabase/supabase-js'

// 伺服器端專用 client：用 service_role(secret) key，繞過 RLS。
// 僅在 server（API routes / server components）使用，勿暴露到前端。
const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})
