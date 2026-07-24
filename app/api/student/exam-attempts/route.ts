import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { examId?: string; answers?: Record<string, number> };
  const examId = String(body.examId ?? "").trim();

  if (!examId) {
    return NextResponse.json({ error: "معرّف الامتحان غير صالح" }, { status: 400 });
  }

  const supabase = createRouteSupabaseClient(await cookies());
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
  }

  const answers = body.answers && typeof body.answers === "object" && !Array.isArray(body.answers) ? body.answers : {};

  const { data, error } = await supabase.rpc("record_exam_attempt", {
    p_exam_id: examId,
    p_answers: answers,
  });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "تعذر حفظ النتيجة" }, { status: 400 });
  }

  return NextResponse.json({ attempt: data });
}
