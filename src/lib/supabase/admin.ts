import { createClient } from "@supabase/supabase-js";
import { getServiceRoleEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getServiceRoleEnv();
  if (!env) return null;

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
