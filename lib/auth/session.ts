import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
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
  const serviceSupabase = createServiceSupabaseClient();
  const { data: authUser } = await supabase.auth.getUser();
  const user = authUser.user;
  if (!user) return null;

  const { data } = await serviceSupabase
    .from("users")
    .select("id, role, name, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data || !["student", "parent", "teacher"].includes(data.role)) return null;
  return data as AppProfile;
}
