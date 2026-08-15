import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClientWithBufferedCookies } from "@/lib/supabase/server";

const roles = new Set(["student", "parent", "teacher"]);

function makeAuthEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@vision-center.com`;
}

function parseString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function getReadableSupabaseError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";

  if (code === "23505" || /already (?:exists|registered)|duplicate key|unique/i.test(message)) {
    return "رقم الهاتف مسجل بالفعل";
  }

  return message || "تعذر إنشاء الحساب";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const role = parseString(body?.role) ?? "";
  const phone = normalizeEgyptianPhone(parseString(body?.phone) ?? "");
  const name = parseString(body?.name) ?? "";
  const fullName = parseString(body?.full_name) ?? name;
  const password = parseString(body?.password) ?? "";

  if (!roles.has(role) || !phone || !name || password.length < 8) {
    return NextResponse.json({ error: "البيانات غير مكتملة أو كلمة المرور أقل من 8 حروف" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(cookieStore);
  const { data: settings } = await supabase.from("system_settings").select("registration_open").limit(1).maybeSingle();
  if (settings && !settings.registration_open) {
    return attachBufferedCookies(NextResponse.json({ error: "التسجيل مغلق حالياً" }, { status: 403 }));
  }

  const stage = parseString(body?.stage);
  const grade = parseString(body?.grade);
  const track = parseString(body?.track);
  const schoolName = parseString(body?.school_name);
  const studentCode = parseString(body?.student_code);
  const profileImage = parseString(body?.profile_image) ?? parseString(body?.photo_name);
  const parentPhoneValue = parseString(body?.parent_phone);
  const parentPhone = parentPhoneValue ? normalizeEgyptianPhone(parentPhoneValue) : null;
  const childName = parseString(body?.child_name);
  const subjects = parseStringArray(body?.subjects);
  let studentPhone = parseString(body?.student_phone);
  if (studentPhone) studentPhone = normalizeEgyptianPhone(studentPhone);

  if (role === "student" && parentPhone && parentPhone === phone) {
    return attachBufferedCookies(NextResponse.json({ error: "رقم الطالب لازم يختلف عن رقم ولي الأمر" }, { status: 400 }));
  }

  const authEmail = makeAuthEmail(phone);
  const signUpResult = await supabase.auth.signUp({
    email: authEmail,
    password,
    options: {
      data: {
        name,
        full_name: fullName,
        role,
        phone,
        auth_email: authEmail,
        stage,
        grade,
        track,
        school_name: schoolName,
        parent_phone: parentPhone,
        subjects,
        student_code: studentCode,
        student_phone: studentPhone,
        profile_image: profileImage,
        child_name: childName,
      },
    },
  });

  if (signUpResult.error || !signUpResult.data.user) {
    return attachBufferedCookies(NextResponse.json({ error: getReadableSupabaseError(signUpResult.error) }, { status: 400 }));
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { error: profileError } = await serviceSupabase.from("users").insert({
    id: signUpResult.data.user.id,
    auth_user_id: signUpResult.data.user.id,
    name: fullName,
    full_name: fullName,
    phone,
    role,
    stage,
    grade,
    track,
    school_name: schoolName,
    parent_phone: parentPhone ?? null,
    student_phone: studentPhone ?? null,
    subjects,
    student_code: studentCode,
    permissions: [],
    active: true,
    extra: {
      profile_image: profileImage,
      auth_email: authEmail,
      child_name: childName,
    },
  });

  if (profileError) {
    await serviceSupabase.auth.admin.deleteUser(signUpResult.data.user.id);
    return attachBufferedCookies(NextResponse.json({ error: getReadableSupabaseError(profileError) }, { status: 400 }));
  }

  return attachBufferedCookies(NextResponse.json({ requiresPhoneVerification: !signUpResult.data.session, role }));
}
