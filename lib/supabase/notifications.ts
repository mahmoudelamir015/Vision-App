import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type NotificationRecord = {
  id?: string;
  title: string;
  body: string;
  audience_role?: string | null;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  student_code?: string | null;
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
    student_code: typeof record.student_code === "string" ? record.student_code : null,
    published: typeof record.published === "boolean" ? record.published : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchNotifications(opts?: {
  studentCode?: string | null;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
}): Promise<NotificationRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  // Fetch all published notifications, then filter client-side for the student
  const { data, error } = await client
    .from(supabaseTableNames.notifications)
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !Array.isArray(data)) return [];

  const records = data
    .map((r) => normalize(r as SupabaseRecord))
    .filter((r): r is NotificationRecord => Boolean(r));

  if (!opts) return records;

  // Filter: show if broadcast (no student_code, no stage) OR matches student
  return records.filter((n) => {
    // Admin-targeted notifications - don't show to students
    if (n.audience_role === "admin") return false;

    // Individual student notification
    if (n.student_code) {
      return opts.studentCode && n.student_code === opts.studentCode;
    }
    // Group notification
    if (n.stage) {
      const stageMatch = !opts.stage || n.stage === opts.stage;
      const gradeMatch = !n.grade || n.grade === opts.grade;
      const trackMatch = !n.track || n.track === opts.track;
      return stageMatch && gradeMatch && trackMatch;
    }
    // Broadcast - show to all
    return true;
  });
}
