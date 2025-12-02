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
      lock: async <R>(
        _name: string,
        _acquireTimeout: number,
        fn: () => Promise<R>,
      ): Promise<R> => {
        return await fn();
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => {
        return Math.min(1000 * Math.pow(2, tries), 30000);
      },
    },
  },
);
