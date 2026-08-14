import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data: parentProfile } = await supabase
    .from("users")
    .select("id, name, phone, role")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (!parentProfile) return NextResponse.json({ error: "تعذر العثور على الحساب" }, { status: 404 });

  const serviceSupabase = createServiceSupabaseClient();
  const { data: students } = await serviceSupabase
    .from("users")
    .select("id, name, phone, stage, grade, track, student_code")
    .eq("parent_phone", parentProfile.phone)
    .eq("role", "student");

  const child = Array.isArray(students) && students.length > 0 ? students[0] : null;

  const { data: exams } = await serviceSupabase
    .from("exams")
    .select("id, title, stage, grade, track, price, pricing_mode")
    .gt("price", 0)
    .or("published_at.not.is.null");

  const financialItems = Array.isArray(exams)
    ? exams
        .filter((exam) => {
          if (!child) return false;
          const stageMatch = !exam.stage || exam.stage === child.stage;
          const gradeMatch = !exam.grade || exam.grade === child.grade;
          const trackMatch = !exam.track || exam.track === child.track;
          return stageMatch && gradeMatch && trackMatch;
        })
        .map((exam) => ({
          id: exam.id,
          title: exam.title,
          price: Number(exam.price ?? 0),
          stage: exam.stage,
          grade: exam.grade,
          track: exam.track,
          kind: "exam",
        }))
    : [];

  return NextResponse.json({
    child,
    financialItems,
  });
}
