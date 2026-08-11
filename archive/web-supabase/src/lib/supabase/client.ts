import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@carekin/types";

// For Client Components — form submissions that call Supabase directly, and
// Realtime subscriptions (chat, live booking status) once those exist.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
