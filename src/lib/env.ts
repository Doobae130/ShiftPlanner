export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export type ServiceRoleEnv = PublicSupabaseEnv & {
  serviceRoleKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getServiceRoleEnv(): ServiceRoleEnv | null {
  const publicEnv = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnv || !serviceRoleKey) {
    return null;
  }

  return { ...publicEnv, serviceRoleKey };
}

export function hasSupabaseEnv() {
  return Boolean(getPublicSupabaseEnv());
}

export function hasServiceRoleEnv() {
  return Boolean(getServiceRoleEnv());
}
