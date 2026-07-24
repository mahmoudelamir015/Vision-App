import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; password?: string };
  const phone = normalizeEgyptianPhone(body.phone ?? "");
  const password = body.password ?? "";
  if (!phone || password.length < 8) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });

  const supabase = createRouteSupabaseClient(await cookies());
  const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
  if (error || !data.user) return NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, phone, role")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!profile || !["student", "parent", "teacher"].includes(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "الحساب غير مهيأ للدخول" }, { status: 403 });
  }

  return NextResponse.json({ profile });
}
