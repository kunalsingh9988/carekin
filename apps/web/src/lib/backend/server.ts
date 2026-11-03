import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { backendConfig } from "./config";
export async function supabaseServer() {
  const store = await cookies();
  const { url, key } = backendConfig();
  return createServerClient(url, key, { cookies: {
    getAll: () => store.getAll(),
    setAll: (values) => { for (const { name, value, options } of values) store.set(name, value, options); },
  } });
}
