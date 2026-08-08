import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

function parseString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppProfile();
    if (!profile) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { token?: string } | null;
    const token = parseString(body?.token);
    if (!token) {
      return NextResponse.json({ error: "الباركود غير صالح" }, { status: 400 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    const { data: student, error: studentError } = await serviceSupabase
      .from("users")
      .select("id, name, phone, stage, grade, track")
      .eq("auth_user_id", profile.id)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: "تعذر العثور على بيانات الطالب" }, { status: 400 });
    }

    const studentPhone = parseString(student.phone) ?? profile.phone;
    const studentName = parseString(student.name) ?? profile.name;

    const { data, error } = await serviceSupabase.rpc("record_attendance", {
      student_name: studentName,
      student_phone: studentPhone,
      stage: parseString(student.stage),
      grade: parseString(student.grade),
      track: parseString(student.track),
      address: null,
      code: null,
      qr_value: token,
    });

    if (error) {
      const message = error.message || "تعذر تسجيل الحضور";
      if (message.includes("INSUFFICIENT_BALANCE")) {
        return NextResponse.json({ error: "عفواً، الرصيد غير كافٍ. يرجى مراجعة السكرتارية." }, { status: 400 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const record = Array.isArray(data) && data.length > 0 ? data[0] : data;
    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تسجيل الحضور" }, { status: 400 });
  }
}
