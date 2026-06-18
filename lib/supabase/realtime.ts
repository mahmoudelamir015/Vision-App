import { getSupabaseClient } from "./index";

type RealtimeCallback = (payload: any) => void;

export function subscribeToTable(table: string, cb: RealtimeCallback) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase غير مضبوط");

  const chan = client
    .channel(`realtime:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        try {
          cb(payload);
        } catch (e) {
          console.error("realtime callback error", e);
        }
      }
    )
    .subscribe();

  return async () => {
    try {
      await client.removeChannel(chan);
    } catch (e) {
      console.warn("failed to remove channel", e);
    }
  };
}
