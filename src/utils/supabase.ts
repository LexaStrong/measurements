import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Cloud sync will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const useSupabase = () => {
  const { session } = useSession();

  return useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey || !session) return null;
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => await session.getToken({ template: 'supabase' }) ?? '',
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({ template: 'supabase' });
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          return fetch(url, { ...options, headers });
        }
      }
    });
  }, [session]);
};

export const SYNC_CHANNELS = {
  RECORDS: 'public:records',
};
