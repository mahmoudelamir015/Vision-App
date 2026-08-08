import { NextResponse } from "next/server";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; password?: string };
  const phone = normalizeEgyptianPhone(body.phone ?? "");

  if (!phone || (body.password?.length ?? 0) < 8) {
    return NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 400 });
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { data: user, error: userError } = await serviceSupabase
    .from("users")
    .select("auth_user_id, role")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (userError || !user?.auth_user_id) {
    return NextResponse.json({ error: "لم يتم العثور على الحساب" }, { status: 404 });
  }

  const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(user.auth_user_id, {
    password: body.password!,
  });

  if (updateError) {
    return NextResponse.json({ error: "تعذر تغيير كلمة المرور" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, role: user.role ?? "student" });
}
