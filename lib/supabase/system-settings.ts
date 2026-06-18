import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type SystemSettings = {
  id?: string;
  wallet_enabled: boolean;
  registration_open: boolean;
  show_results: boolean;
};

export async function fetchSystemSettings(): Promise<SystemSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from(supabaseTableNames.systemSettings)
    .select("id, wallet_enabled, registration_open, show_results")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SystemSettings;
}

function normalizeSystemSettings(data: SupabaseRecord | null): SystemSettings | null {
  if (!data) return null;

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    wallet_enabled: Boolean(data.wallet_enabled),
    registration_open: Boolean(data.registration_open),
    show_results: Boolean(data.show_results),
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
        })
        .eq("id", existing.id)
        .select("id, wallet_enabled, registration_open, show_results")
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
      })
      .select("id, wallet_enabled, registration_open, show_results")
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
