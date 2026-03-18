import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During SSG build, env vars may not be set — return a no-op client
    // that will be replaced at runtime in the browser
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
