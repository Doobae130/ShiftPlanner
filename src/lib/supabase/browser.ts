"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const env = getPublicSupabaseEnv();
  if (!env) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }

  return browserClient;
}
