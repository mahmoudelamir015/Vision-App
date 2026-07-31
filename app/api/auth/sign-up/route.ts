import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

const roles = new Set(["student", "parent", "teacher"]);

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const role = typeof body.role === "string" ? body.role : "";
  const phone = normalizeEgyptianPhone(typeof body.phone === "string" ? body.phone : "");
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!roles.has(role) || !phone || !name || password.length < 8) {
    return NextResponse.json({ error: "البيانات غير مكتملة أو كلمة المرور أقل من 8 حروف" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const { data: settings } = await supabase.from("system_settings").select("registration_open").limit(1).maybeSingle();
  if (settings && !settings.registration_open) {
    return NextResponse.json({ error: "التسجيل مغلق حالياً" }, { status: 403 });
  }

  const stage = typeof body.stage === "string" ? body.stage : null;
  const grade = typeof body.grade === "string" ? body.grade : null;
  const track = typeof body.track === "string" ? body.track : null;
  const schoolName = typeof body.school_name === "string" ? body.school_name : null;
  const studentCode = typeof body.student_code === "string" ? body.student_code : null;
  const profileImage =
    typeof body.profile_image === "string"
      ? body.profile_image
      : typeof body.photo_name === "string"
        ? body.photo_name
        : null;
  const parentPhone = normalizeEgyptianPhone(typeof body.parent_phone === "string" ? body.parent_phone : "");
  const subjects = Array.isArray(body.subjects) ? body.subjects.filter((item): item is string => typeof item === "string") : [];

  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: {
        name,
        role,
        stage,
        grade,
        track,
        school_name: schoolName,
        parent_phone: parentPhone,
        subjects,
        student_code: studentCode,
        profile_image: profileImage,
      },
    },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "تعذر إنشاء الحساب بهذا الرقم" }, { status: 400 });
  }

  return NextResponse.json({ requiresPhoneVerification: !data.session, role });
}
