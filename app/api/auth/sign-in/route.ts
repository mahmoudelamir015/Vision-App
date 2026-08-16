import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClientWithBufferedCookies } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SignInBody = {
  phone?: string;
  password?: string;
  expectedRole?: "student" | "parent" | "teacher";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignInBody;
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const normalizedPhone = normalizeEgyptianPhone(rawPhone);
  const password = typeof body.password === "string" ? body.password : "";
  const expectedRole = body.expectedRole;

  if (!rawPhone || password.length < 8) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(cookieStore);
  const serviceSupabase = createServiceSupabaseClient();

  const rawDigits = rawPhone.replace(/\D/g, "");
  let localPart = "";
  if (rawDigits.startsWith("20")) localPart = rawDigits.slice(2);
  else if (rawDigits.startsWith("0")) localPart = rawDigits.slice(1);
  else localPart = rawDigits;

  const candidatePhones = Array.from(
    new Set(
      [normalizedPhone, rawPhone, `0${localPart}`, `+20${localPart}`, `20${localPart}`].filter(
        (v): v is string => Boolean(v),
      ),
    ),
  );

  const authEmailCandidates = new Set<string>();
  if (localPart) {
    authEmailCandidates.add(`0${localPart}@vision-center.com`);
    authEmailCandidates.add(`20${localPart}@vision-center.com`);
  }

  const { data: dbMatches } = await serviceSupabase
    .from("users")
    .select("extra")
    .in("phone", candidatePhones);

  dbMatches?.forEach((row: any) => {
    if (row?.extra?.auth_email && typeof row.extra.auth_email === "string") {
      authEmailCandidates.add(row.extra.auth_email.trim());
    }
  });

  let authUser: { id: string } | null = null;

  for (const phoneAttempt of candidatePhones) {
    const res = await supabase.auth.signInWithPassword({ phone: phoneAttempt, password });
    if (!res.error && res.data?.user) {
      authUser = res.data.user;
      break;
    }
  }

  if (!authUser) {
    for (const emailAttempt of Array.from(authEmailCandidates)) {
      const res = await supabase.auth.signInWithPassword({ email: emailAttempt, password });
      if (!res.error && res.data?.user) {
        authUser = res.data.user;
        break;
      }
    }
  }

  if (!authUser) {
    return attachBufferedCookies(
      NextResponse.json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 }),
    );
  }

  let profile: any = null;

  const { data: profileById } = await serviceSupabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, extra")
    .or(`auth_user_id.eq.${authUser.id},id.eq.${authUser.id}`)
    .maybeSingle();

  profile = profileById;

  if (!profile) {
    const { data: profileByPhone } = await serviceSupabase
      .from("users")
      .select("id, auth_user_id, name, phone, role, extra")
      .in("phone", candidatePhones)
      .maybeSingle();

    if (profileByPhone) {
      profile = profileByPhone;
      if (profile.id) {
        await serviceSupabase.from("users").update({ auth_user_id: authUser.id }).eq("id", profile.id);
      }
    }
  }

  if (!profile) {
    const meta = (authUser as any).user_metadata || {};
    profile = {
      id: authUser.id,
      auth_user_id: authUser.id,
      name: meta.name || meta.full_name || "مستخدم",
      phone: (authUser as any).phone || rawPhone,
      role: meta.role || expectedRole || "student",
      extra: {},
    };
  }

  const currentRole = String(profile.role || "").trim().toLowerCase();
  const reqRole = expectedRole ? String(expectedRole).trim().toLowerCase() : null;

  if (reqRole && currentRole !== reqRole) {
    await supabase.auth.signOut();
    return attachBufferedCookies(
      NextResponse.json({ error: "الحساب غير مصرح له بالدخول من هذه البوابة" }, { status: 401 }),
    );
  }

  return attachBufferedCookies(NextResponse.json({ profile }));
}
