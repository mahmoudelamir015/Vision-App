import { getSupabaseClient, supabaseTableNames } from "./index";

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
