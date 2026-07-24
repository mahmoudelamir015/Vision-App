import { createServerClient, type CookieOptions } from "@supabase/ssr";

type WritableCookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: CookieOptions) => void;
};

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return { url, key };
}

const secureCookieOptions = (options: CookieOptions): CookieOptions => ({
  ...options,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export function createRouteSupabaseClient(cookieStore: WritableCookieStore) {
  const { url, key } = getConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, secureCookieOptions(options)));
      },
    },
  });
}
