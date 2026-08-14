import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id?: string;
  auth_user_id?: string;
  role?: "student" | "parent" | "teacher";
  name?: string;
  phone?: string;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  school_name?: string | null;
  student_code?: string | null;
  subjects?: string[] | null;
  extra?: Record<string, unknown> | null;
};

function readProfileImage(extra: Record<string, unknown> | null | undefined) {
  return typeof extra?.profile_image === "string" ? extra.profile_image : undefined;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "تعذر تحميل الملف الشخصي" }, { status: 400 });

  const row = data as ProfileRow;
  return NextResponse.json({
    profile: {
      ...row,
      profile_image: readProfileImage(row.extra),
    },
  });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, auth_user_id, role, name, phone, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "تعذر العثور على الحساب" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

  const role = profile.role as ProfileRow["role"];
  const payload: Record<string, unknown> = { name };

  if (role === "teacher") {
    if (typeof body?.stage === "string") {
      payload.stage = body.stage;
    }

    if (typeof body?.profile_image === "string") {
      payload.extra = {
        ...(profile.extra ?? {}),
        profile_image: body.profile_image,
      };
    }
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { error: updateError } = await serviceSupabase.from("users").update(payload).eq("auth_user_id", authUser.user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { data, error } = await serviceSupabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "تعذر حفظ الملف الشخصي" }, { status: 400 });

  const row = data as ProfileRow;
  return NextResponse.json({
    profile: {
      ...row,
      profile_image: readProfileImage(row.extra),
    },
  });
}
