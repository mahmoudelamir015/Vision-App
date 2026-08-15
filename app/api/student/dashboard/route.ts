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

  const { data: assignments } = await serviceSupabase
    .from("teacher_student_groups")
    .select("teacher_user_id, subject")
    .eq("student_user_id", student.id);

  // If there are specific assignments, we should merge the allowed subjects per teacher
  const allowedTeacherSubjects: Record<string, string[]> = {};
  if (assignments && assignments.length > 0) {
    for (const row of assignments) {
      if (!allowedTeacherSubjects[row.teacher_user_id]) allowedTeacherSubjects[row.teacher_user_id] = [];
      allowedTeacherSubjects[row.teacher_user_id].push(row.subject);
    }
  }

  let teachers = await fetchTeachersForLearner(serviceSupabase, {
    stage: student.stage ?? null,
    grade: student.grade ?? null,
    track: student.track ?? null,
  });

  if (assignments && assignments.length > 0) {
    // Only show teachers assigned to this student
    teachers = teachers.filter((t) => t.id && allowedTeacherSubjects[t.id]);
    
    // Inject the allowed subjects only for the student
    teachers = teachers.map((t) => {
      const assignedSubjects = allowedTeacherSubjects[t.id!] || [];
      return {
        ...t,
        subjects: t.subjects?.filter((sub) => assignedSubjects.some((s) => s.trim().toLowerCase() === sub.trim().toLowerCase())) || [],
      };
    });
  }

  return NextResponse.json({
    student,
    teachers,
  });
}
