import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type WalletEntry = {
  id?: string;
  owner: string;
  account_type: string;
  amount: number;
  reason?: string;
  student_phone?: string;
  created_at?: string;
};

const normalize = (record: SupabaseRecord | null): WalletEntry | null => {
  if (!record) return null;
  const owner = (typeof record.owner === "string" && record.owner.trim()) || (typeof record.student_phone === "string" && record.student_phone) || "معاملة مالية";
  const account_type = (typeof record.account_type === "string" && record.account_type.trim()) || "student";
  const amount = typeof record.amount === "number" ? record.amount : Number(record.amount ?? 0);
  return {
    id: typeof record.id === "string" ? record.id : undefined,
    owner,
    account_type,
    amount,
    reason: typeof record.reason === "string" ? record.reason : undefined,
    student_phone: typeof record.student_phone === "string" ? record.student_phone : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchWalletEntries(): Promise<WalletEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.wallets).select("*").order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];

  return data
    .map((r) => normalize(r as SupabaseRecord))
    .filter((r): r is WalletEntry => Boolean(r));
}

export async function saveWalletEntry(entry: WalletEntry): Promise<WalletEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    owner: entry.owner,
    account_type: entry.account_type,
    amount: entry.amount,
    reason: entry.reason ?? null,
    student_phone: entry.student_phone ?? null,
    created_at: entry.created_at ?? new Date().toISOString(),
  } as Record<string, unknown>;

  const { data, error } = await client.from(supabaseTableNames.wallets).insert(payload).select("*").single();
  if (error) return null;
  return normalize(data as SupabaseRecord | null);
}

export function subscribeToWalletEntries(callback: (records: WalletEntry[]) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel("public:wallets")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: supabaseTableNames.wallets },
      async () => {
        const rows = await fetchWalletEntries();
        callback(rows);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
