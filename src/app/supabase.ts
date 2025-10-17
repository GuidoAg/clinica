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
      flowType: "pkce",
      // Deshabilita el lock completamente para evitar conflictos entre pestañas
      lock: async <R>(
        _name: string,
        _acquireTimeout: number,
        fn: () => Promise<R>,
      ): Promise<R> => {
        return await fn();
      },
    },
  },
);
