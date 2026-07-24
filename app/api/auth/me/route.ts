import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";

export async function GET() {
  const profile = await getCurrentAppProfile();
  return profile ? NextResponse.json({ profile }) : NextResponse.json({ error: "غير مسجل" }, { status: 401 });
}
