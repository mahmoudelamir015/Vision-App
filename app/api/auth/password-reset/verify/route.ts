import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; token?: string; password?: string };
  const phone = normalizeEgyptianPhone(body.phone ?? "");
  if (!phone || !/^\d{6}$/.test(body.token ?? "") || (body.password?.length ?? 0) < 8) {
    return NextResponse.json({ error: "بيانات التحقق غير صحيحة" }, { status: 400 });
  }
  const supabase = createRouteSupabaseClient(await cookies());
  const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: body.token!, type: "sms" });
  if (verifyError) return NextResponse.json({ error: "رمز التحقق غير صحيح أو انتهت صلاحيته" }, { status: 401 });
  const { error: updateError } = await supabase.auth.updateUser({ password: body.password! });
  if (updateError) return NextResponse.json({ error: "تعذر تغيير كلمة المرور" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
