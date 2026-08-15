import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabaseClientWithBufferedCookies } from "@/lib/supabase/server";

export async function POST() {
  const { supabase, attachBufferedCookies } = createRouteSupabaseClientWithBufferedCookies(await cookies());
  await supabase.auth.signOut();
  return attachBufferedCookies(NextResponse.json({ ok: true }));
}
