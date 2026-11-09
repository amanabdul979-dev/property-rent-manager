/**
 * Supabase Client Configuration & Data Layer for Next.js App Router
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project.supabase.co') &&
    !SUPABASE_ANON_KEY.includes('your-anon-key')
  );
}

export async function supabaseRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const cleanUrl = SUPABASE_URL.replace(/\/+$/, '');
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  const res = await fetch(`${cleanUrl}/rest/v1/${endpoint.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase error (${res.status}): ${errorText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (null as any);
}
