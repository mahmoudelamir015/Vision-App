import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { phone: rawPhone } = (await request.json()) as { phone?: string };
  const phone = normalizeEgyptianPhone(rawPhone ?? "");
  if (!phone) return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
  const supabase = createRouteSupabaseClient(await cookies());
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });
  if (error) return NextResponse.json({ error: "تعذر إرسال رمز التحقق" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
