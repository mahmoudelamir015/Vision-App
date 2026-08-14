import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    password?: string;
    expectedRole?: "student" | "parent" | "teacher";
  };

  const phone = normalizeEgyptianPhone(body.phone ?? "");
  const password = body.password ?? "";
  const expectedRole = body.expectedRole;
  if (!phone || password.length < 8) {
    return NextResponse.json({ error: "ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ط®ظˆظ„ ط؛ظٹط± طµط­ظٹط­ط©" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const serviceSupabase = createServiceSupabaseClient();
  const phoneValue = phone ?? "";
  const phoneDigits = phoneValue.replace(/\D/g, "");
  const authEmail = `${phoneDigits}@vision-center.com`;
  const attempts = [
    () => supabase.auth.signInWithPassword({ phone: phoneValue, password }),
    () => supabase.auth.signInWithPassword({ email: authEmail, password }),
  ];

  let data = null as { user: { id: string } | null } | null;
  let error = null as { message?: string } | null;
  for (const attempt of attempts) {
    const result = await attempt();
    data = result.data;
    error = result.error;
    if (!error && data?.user) break;
  }

  if (error || !data?.user) {
    return NextResponse.json({ error: "ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©" }, { status: 401 });
  }

  const { data: profile } = await serviceSupabase
    .from("users")
    .select("id, name, phone, role")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!profile || !["student", "parent", "teacher"].includes(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "ط§ظ„ط­ط³ط§ط¨ ط؛ظٹط± ظ…ظ‡ظٹط£ ظ„ظ„ط¯ط®ظˆظ„" }, { status: 403 });
  }

  if (expectedRole && profile.role !== expectedRole) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "ط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ظ† ط§ظ„ط¨ظˆط§ط¨ط© ط§ظ„طµط­ظٹط­ط©" }, { status: 401 });
  }

  return NextResponse.json({ profile });
}
