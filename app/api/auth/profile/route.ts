import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

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

async function getCurrentAuthUserId() {
  const cookieStore = await cookies();
  const routeSupabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await routeSupabase.auth.getUser();
  return authUser.user?.id ?? null;
}

export async function GET() {
  const authUserId = await getCurrentAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUserId)
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
  const authUserId = await getCurrentAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, auth_user_id, role, name, phone, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUserId)
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

  const { error: updateError } = await supabase.from("users").update(payload).eq("auth_user_id", authUserId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, name, phone, role, stage, grade, track, school_name, student_code, subjects, extra")
    .eq("auth_user_id", authUserId)
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
