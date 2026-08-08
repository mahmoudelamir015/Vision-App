import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "تعذر تحميل الملف الشخصي" }, { status: 400 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = normalizeEgyptianPhone(typeof body?.phone === "string" ? body.phone : "");
  const stage = typeof body?.stage === "string" ? body.stage : null;
  const grade = typeof body?.grade === "string" ? body.grade : null;
  const track = typeof body?.track === "string" ? body.track : null;
  const schoolName = typeof body?.school_name === "string" ? body.school_name.trim() : null;

  if (!name || !phone) return NextResponse.json({ error: "الاسم ورقم الهاتف مطلوبان" }, { status: 400 });

  const serviceSupabase = createServiceSupabaseClient();
  const { error: updateError } = await serviceSupabase
    .from("users")
    .update({
      name,
      phone,
      stage,
      grade,
      track,
      school_name: schoolName,
    })
    .eq("auth_user_id", authUser.user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { data, error } = await serviceSupabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "تعذر حفظ الملف الشخصي" }, { status: 400 });
  return NextResponse.json({ profile: data });
}
