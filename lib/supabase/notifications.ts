import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type NotificationRecord = {
  id?: string;
  title: string;
  body: string;
  audience_role?: string | null;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  published?: boolean;
  created_at?: string;
};

const normalize = (record: SupabaseRecord | null): NotificationRecord | null => {
  if (!record) return null;
  const title = typeof record.title === "string" ? record.title : "";
  const body = typeof record.body === "string" ? record.body : "";
  if (!title || !body) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    title,
    body,
    audience_role: typeof record.audience_role === "string" ? record.audience_role : null,
    stage: typeof record.stage === "string" ? record.stage : null,
    grade: typeof record.grade === "string" ? record.grade : null,
    track: typeof record.track === "string" ? record.track : null,
    published: typeof record.published === "boolean" ? record.published : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.notifications).select("*").order("created_at", { ascending: false }).limit(10);
  if (error || !Array.isArray(data)) return [];

  return data.map((record) => normalize(record as SupabaseRecord)).filter((record): record is NotificationRecord => Boolean(record));
}
