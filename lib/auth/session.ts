import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "student" | "parent" | "teacher";

export type AppProfile = {
  id: string;
  role: AppRole;
  name: string;
  phone: string;
};

export async function getCurrentAppProfile(): Promise<AppProfile | null> {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims ?? null;
  if (!claims?.sub) return null;

  const { data } = await supabase
    .from("users")
    .select("id, role, name, phone")
    .eq("auth_user_id", claims.sub)
    .maybeSingle();

  if (!data || !["student", "parent", "teacher"].includes(data.role)) return null;
  return data as AppProfile;
}
