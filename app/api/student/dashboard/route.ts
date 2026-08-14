import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { fetchTeachersForLearner } from "@/lib/supabase/learner-network";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const serviceSupabase = createServiceSupabaseClient();
  const { data: student } = await serviceSupabase
    .from("users")
    .select("id, name, phone, role, stage, grade, track, student_code, school_name, subjects")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (!student || student.role !== "student") {
    return NextResponse.json({ error: "الحساب غير مخصص للطالب" }, { status: 403 });
  }

  const teachers = await fetchTeachersForLearner(serviceSupabase, {
    stage: student.stage ?? null,
    grade: student.grade ?? null,
    track: student.track ?? null,
  });

  return NextResponse.json({
    student,
    teachers,
  });
}
