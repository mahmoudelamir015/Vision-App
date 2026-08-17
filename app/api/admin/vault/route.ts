import { NextResponse } from "next/server";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentAppProfile();
    if (!profile) {
      return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Fetch transactions from database
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch settlements
    const { data: settlements } = await supabase
      .from("settlements")
      .select("*")
      .order("settled_at", { ascending: false });

    // Fetch total wallet entries from wallets table as well
    const { data: wallets } = await supabase
      .from("wallets")
      .select("*")
      .order("created_at", { ascending: false });

    const totalInTransactions = (transactions || []).reduce((acc: number, curr: { amount: number; type: string }) => {
      const val = Number(curr.amount || 0);
      return curr.type === "credit" ? acc + val : acc - val;
    }, 0);

    const totalWallets = (wallets || []).reduce((acc: number, curr: { amount: number }) => {
      return acc + Number(curr.amount || 0);
    }, 0);

    return NextResponse.json({
      vaultBalance: totalInTransactions + totalWallets,
      transactions: transactions || [],
      settlements: settlements || [],
      wallets: wallets || []
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppProfile();
    if (!profile) {
      return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, reason, user_id } = body;

    if (!amount || !type || !reason) {
      return NextResponse.json({ error: "جميع البيانات مطلوبة" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const targetUserId = user_id || profile.id;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: targetUserId,
        amount: Number(amount),
        type,
        reason,
        created_by: profile.id
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, transaction: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
