import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const allowedFields = new Set(["phone", "student_code", "stage", "grade", "track", "school_name", "subjects", "profile_image"]);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, auth_user_id, role")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "تعذر العثور على الحساب" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const requestedField = typeof body?.requested_field === "string" ? body.requested_field : "";
  const newValue = typeof body?.new_value === "string" ? body.new_value.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!allowedFields.has(requestedField) || !newValue || !reason) {
    return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { data, error } = await serviceSupabase
    .from("change_requests")
    .insert({
      user_id: authUser.user.id,
      user_type: profile.role,
      requested_field: requestedField,
      new_value: newValue,
      reason,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ request: data });
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteSupabaseClient(cookieStore);
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, auth_user_id, role")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "تعذر العثور على الحساب" }, { status: 404 });

  const serviceSupabase = createServiceSupabaseClient();
  const query = serviceSupabase.from("change_requests").select("*").order("created_at", { ascending: false });
  if (profile.role !== "master_admin") {
    query.eq("user_id", authUser.user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ requests: Array.isArray(data) ? data : [] });
}
