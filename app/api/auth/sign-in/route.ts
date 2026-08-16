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

function makeAuthEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@vision-center.com`;
}

function getProfileAuthEmail(extra: unknown) {
  if (!extra || typeof extra !== "object") return null;
  const value = (extra as { auth_email?: unknown }).auth_email;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SignInBody;
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = normalizeEgyptianPhone(rawPhone);
  const password = typeof body.password === "string" ? body.password : "";
  const expectedRole = body.expectedRole;

  if (!phone || password.length < 8) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(cookieStore);
  const serviceSupabase = createServiceSupabaseClient();
  let localPart = "";
  const rawDigits = rawPhone.replace(/\D/g, "");
  if (rawDigits.startsWith("20")) localPart = rawDigits.slice(2);
  else if (rawDigits.startsWith("0")) localPart = rawDigits.slice(1);
  else localPart = rawDigits;

  const candidatePhones = Array.from(
    new Set([
      phone,
      `0${localPart}`,
      `+20${localPart}`,
      `20${localPart}`,
      rawPhone,
    ].filter((value): value is string => Boolean(value))),
  );

  const authEmailCandidates = new Set<string>();
  if (localPart) {
    authEmailCandidates.add(`0${localPart}@vision-center.com`);
    authEmailCandidates.add(`20${localPart}@vision-center.com`);
  }
  const { data: matchingProfiles } = await serviceSupabase
    .from("users")
    .select("extra, role")
    .in("phone", candidatePhones)
    .in("role", expectedRole ? [expectedRole] : ["student", "parent", "teacher"]);

  matchingProfiles?.forEach((profile) => {
    const authEmail = getProfileAuthEmail((profile as { extra?: unknown }).extra);
    if (authEmail) {
      authEmailCandidates.add(authEmail);
    }
  });

  let data: { user: { id: string } | null } | null = null;
  let error: { message?: string } | null = null;

  const attempts = [
    ...candidatePhones.map((candidatePhone) => () => supabase.auth.signInWithPassword({ phone: candidatePhone, password })),
    ...Array.from(authEmailCandidates).map((candidateEmail) => () => supabase.auth.signInWithPassword({ email: candidateEmail, password })),
  ];

  for (const attempt of attempts) {
    const result = await attempt();
    data = result.data;
    error = result.error;
    if (!error && data?.user) break;
  }

  if (error || !data?.user) {
    return attachBufferedCookies(NextResponse.json({ error: "بيانات غير صحيحة أو الحساب غير مصرح له" }, { status: 401 }));
  }

  const { data: linkedProfile } = await serviceSupabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, extra")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  let profile = linkedProfile;

  if (!profile) {
    const { data: fallbackProfiles } = await serviceSupabase
      .from("users")
      .select("id, auth_user_id, name, phone, role, extra")
      .in("phone", candidatePhones)
      .in("role", expectedRole ? [expectedRole] : ["student", "parent", "teacher"]);

    if (Array.isArray(fallbackProfiles) && fallbackProfiles.length > 0) {
      profile = fallbackProfiles[0];

      if (profile.id && profile.auth_user_id !== data.user.id) {
        await serviceSupabase.from("users").update({ auth_user_id: data.user.id }).eq("id", profile.id);
      }
    }
  }

  if (!profile || !["student", "parent", "teacher"].includes(profile.role)) {
    await supabase.auth.signOut();
    return attachBufferedCookies(NextResponse.json({ error: "بيانات غير صحيحة أو الحساب غير مصرح له" }, { status: 403 }));
  }

  if (expectedRole && profile.role !== expectedRole) {
    await supabase.auth.signOut();
    return attachBufferedCookies(NextResponse.json({ error: "بيانات غير صحيحة أو الحساب غير مصرح له" }, { status: 401 }));
  }

  return attachBufferedCookies(NextResponse.json({ profile }));
}
