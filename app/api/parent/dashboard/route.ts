import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { fetchFinancialItemsForLearner, fetchTeachersForLearner } from "@/lib/supabase/learner-network";

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
  const parentPhoneCandidates = Array.from(
    new Set([normalizeEgyptianPhone(parentProfile.phone) ?? parentProfile.phone, parentProfile.phone].filter(Boolean)),
  );

  const { data: students } = await serviceSupabase
    .from("users")
    .select("id, name, phone, stage, grade, track, student_code, role, parent_phone")
    .eq("role", "student")
    .in("parent_phone", parentPhoneCandidates);

  const child = Array.isArray(students) && students.length > 0 ? students[0] : null;
  const teachers = child
    ? await fetchTeachersForLearner(serviceSupabase, {
        stage: child.stage ?? null,
        grade: child.grade ?? null,
        track: child.track ?? null,
      })
    : [];

  const financialItems = child
    ? await fetchFinancialItemsForLearner(serviceSupabase, {
        stage: child.stage ?? null,
        grade: child.grade ?? null,
        track: child.track ?? null,
      })
    : [];

  return NextResponse.json({
    child,
    teachers,
    financialItems,
  });
}
