import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const profile = await getCurrentAppProfile();
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // 1. Total actual students for this teacher
    const { count: studentCount } = await supabase
      .from("teacher_student_groups")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", profile.id);

    // 2. Total exams created by teacher
    const { count: examCount } = await supabase
      .from("exams")
      .select("id", { count: "exact", head: true })
      .eq("created_by", profile.id);

    // 3. Total materials uploaded by teacher
    const { data: materials } = await supabase
      .from("teacher_materials")
      .select("price")
      .eq("teacher_user_id", profile.id);

    const materialCount = materials?.length || 0;
    const materialRevenue = (materials || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

    return NextResponse.json({
      students: studentCount || 0,
      exams: examCount || 0,
      materials: materialCount,
      revenue: materialRevenue,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
