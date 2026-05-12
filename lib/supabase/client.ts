import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          "x-api-gateway-secret":
            process.env.NEXT_PUBLIC_SUPABASE_API_GATEWAY_SECRET!,
        },
      },
    },
  );
}
