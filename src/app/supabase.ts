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
    realtime: {
      // Configuración optimizada para Realtime
      params: {
        eventsPerSecond: 10, // Límite de eventos por segundo
      },
      heartbeatIntervalMs: 30000, // Heartbeat cada 30 segundos
      reconnectAfterMs: (tries: number) => {
        // Backoff exponencial: 1s, 2s, 4s, 8s, hasta máx 30s
        return Math.min(1000 * Math.pow(2, tries), 30000);
      },
    },
  },
);
