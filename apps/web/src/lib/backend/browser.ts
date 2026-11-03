import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { backendConfig } from "./config";
let client: SupabaseClient | undefined;
export function supabaseBrowser(): SupabaseClient {
  const { url, key } = backendConfig();
  return client ??= createBrowserClient(url, key);
}

export async function remote<T>(operation: string, args: unknown[] = []): Promise<T> {
  const { data, error } = await supabaseBrowser().rpc("carekin_api", { operation, args });
  if (error) throw new Error(error.code === "23505" ? "This record already exists. Refresh to see the saved result." : error.code === "23514" ? "Please check the supplied details." : error.message);
  // A failed PIN attempt must commit its rate-limit counter, so the RPC
  // returns an error result rather than raising a rollback exception.
  if (data && typeof data === "object" && "error" in data) throw new Error(String(data.error));
  return data as T;
}
