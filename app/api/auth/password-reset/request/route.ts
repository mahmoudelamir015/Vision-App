import { NextResponse } from "next/server";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";

export async function POST(request: Request) {
  const { phone: rawPhone } = (await request.json()) as { phone?: string };
  const phone = normalizeEgyptianPhone(rawPhone ?? "");
  if (!phone) return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
