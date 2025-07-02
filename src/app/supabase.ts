import { environment } from '../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const Supabase: SupabaseClient<any, 'core', any> = createClient(
  environment.supabaseUrl,
  environment.supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'core',
    },
  },
);
