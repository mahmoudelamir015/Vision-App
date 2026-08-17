import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type SystemSettings = {
  id?: string;
  wallet_enabled: boolean;
  registration_open: boolean;
  show_results: boolean;
  teacher_ratio?: number;
  lesson_price?: number;
  auto_settlement?: number;
};

export async function fetchSystemSettings(): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from(supabaseTableNames.systemSettings)
    .select("id, wallet_enabled, registration_open, show_results, teacher_ratio, lesson_price, auto_settlement")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeSystemSettings(data as SupabaseRecord);
}

function normalizeSystemSettings(data: SupabaseRecord | null): SystemSettings | null {
  if (!data) return null;

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    wallet_enabled: Boolean(data.wallet_enabled),
    registration_open: Boolean(data.registration_open),
    show_results: Boolean(data.show_results),
    teacher_ratio: typeof data.teacher_ratio === "number" ? data.teacher_ratio : Number(data.teacher_ratio ?? 60),
    lesson_price: typeof data.lesson_price === "number" ? data.lesson_price : Number(data.lesson_price ?? 250),
    auto_settlement: typeof data.auto_settlement === "number" ? data.auto_settlement : Number(data.auto_settlement ?? 80),
  };
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const existing = await fetchSystemSettings();

  try {
    if (existing) {
      const { data, error } = await client
        .from(supabaseTableNames.systemSettings)
        .update({
          wallet_enabled: settings.wallet_enabled ?? existing.wallet_enabled,
          registration_open: settings.registration_open ?? existing.registration_open,
          show_results: settings.show_results ?? existing.show_results,
          teacher_ratio: settings.teacher_ratio ?? existing.teacher_ratio,
          lesson_price: settings.lesson_price ?? existing.lesson_price,
          auto_settlement: settings.auto_settlement ?? existing.auto_settlement,
        })
        .eq("id", existing.id)
        .select("id, wallet_enabled, registration_open, show_results, teacher_ratio, lesson_price, auto_settlement")
        .single();

      if (error) return null;
      return normalizeSystemSettings(data as SupabaseRecord | null);
    }

    const { data, error } = await client
      .from(supabaseTableNames.systemSettings)
      .insert({
        wallet_enabled: settings.wallet_enabled ?? true,
        registration_open: settings.registration_open ?? false,
        show_results: settings.show_results ?? true,
        teacher_ratio: settings.teacher_ratio ?? 60,
        lesson_price: settings.lesson_price ?? 250,
        auto_settlement: settings.auto_settlement ?? 80,
      })
      .select("id, wallet_enabled, registration_open, show_results, teacher_ratio, lesson_price, auto_settlement")
      .single();

    if (error) return null;
    return normalizeSystemSettings(data as SupabaseRecord | null);
  } catch (error) {
    console.error("Unexpected error updating system settings:", error);
    return null;
  }
}

export function subscribeToSystemSettings(callback: (settings: SystemSettings) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel("public:system_settings")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.systemSettings,
      },
      (payload) => {
        if (payload.new) {
          const normalized = normalizeSystemSettings(payload.new as SupabaseRecord);
          if (normalized) callback(normalized);
        }
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
