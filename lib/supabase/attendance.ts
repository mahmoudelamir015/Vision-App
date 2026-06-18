import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type AttendanceRecord = {
  id?: string;
  student_name: string;
  student_phone?: string;
  stage?: string;
  grade?: string;
  track?: string;
  address?: string;
  code?: string;
  qr_value?: string;
  created_at?: string;
};

const normalizeAttendance = (record: SupabaseRecord | null): AttendanceRecord | null => {
  if (!record) return null;

  const student_name = typeof record.student_name === "string" ? record.student_name : "";
  if (!student_name) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    student_name,
    student_phone: typeof record.student_phone === "string" ? record.student_phone : undefined,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    address: typeof record.address === "string" ? record.address : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    qr_value: typeof record.qr_value === "string" ? record.qr_value : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.attendance).select("*");
  if (error || !Array.isArray(data)) return [];

  return data
    .map((record) => normalizeAttendance(record as SupabaseRecord))
    .filter((record): record is AttendanceRecord => Boolean(record));
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<AttendanceRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  // Use server-side RPC `record_attendance` which enforces wallet balance checks atomically
  try {
    const params = {
      student_name: record.student_name,
      student_phone: record.student_phone ?? null,
      stage: record.stage ?? null,
      grade: record.grade ?? null,
      track: record.track ?? null,
      address: record.address ?? null,
      code: record.code ?? null,
      qr_value: record.qr_value ?? null,
    } as Record<string, unknown>;

    const { data, error } = await client.rpc("record_attendance", params);
    if (error) {
      // forward explicit INSUFFICIENT_BALANCE error
      if (error.message && error.message.includes("INSUFFICIENT_BALANCE")) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      return null;
    }

    // rpc returns array of rows
    const row = Array.isArray(data) && data.length > 0 ? data[0] : data as SupabaseRecord | null;
    return normalizeAttendance(row as SupabaseRecord | null);
  } catch (err) {
    throw err;
  }
}

export function subscribeToAttendance(callback: (records: AttendanceRecord[]) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel("public:attendance")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.attendance,
      },
      async () => {
        callback(await fetchAttendanceRecords());
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
