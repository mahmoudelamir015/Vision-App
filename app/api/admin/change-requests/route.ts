import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const profile = await getCurrentAppProfile();
    const role = profile?.role as string;
    if (!profile || (role !== "master_admin" && role !== "staff")) {
      return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("change_requests")
      .select(`
        id,
        user_id,
        user_type,
        requested_field,
        new_value,
        reason,
        status,
        created_at,
        users:user_id (id, name, phone, student_code)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppProfile();
    const role = profile?.role as string;
    if (!profile || (role !== "master_admin" && role !== "staff")) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, admin_reason } = body as { id: string; action: "approved" | "rejected"; admin_reason?: string };

    if (!id || !action || !["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "بيانات الإجراء غير مكتملة" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    // 1. Fetch original request
    const { data: reqData, error: fetchErr } = await supabase
      .from("change_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !reqData) {
      return NextResponse.json({ error: "طلب التعديل غير موجود" }, { status: 404 });
    }

    // 2. If approved, update user table
    if (action === "approved") {
      const fieldMap: Record<string, string> = {
        name: "name",
        phone: "phone",
        stage: "stage",
        grade: "grade",
        track: "track",
      };

      const dbColumn = fieldMap[reqData.requested_field] || reqData.requested_field;
      if (dbColumn) {
        await supabase
          .from("users")
          .update({ [dbColumn]: reqData.new_value })
          .eq("id", reqData.user_id);
      }
    }

    // 3. Update request status
    const { data: updated, error: updateErr } = await supabase
      .from("change_requests")
      .update({
        status: action,
        admin_reason: admin_reason || null,
        resolved_by: profile.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
