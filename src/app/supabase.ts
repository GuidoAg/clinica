import { environment } from "../environments/environment";
import { createClient } from "@supabase/supabase-js";

export const Supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseKey,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
