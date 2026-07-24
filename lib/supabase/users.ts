import { normalizeEgyptianPhone } from "../auth/phone";
import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type AppUserRole = "student" | "parent" | "teacher";

export type AppUserRecord = {
  id?: string;
  auth_user_id?: string;
  name: string;
  phone: string;
  role: AppUserRole;
  stage?: string;
  grade?: string;
  track?: string;
  school_name?: string;
  parent_phone?: string;
  subjects?: string[];
  student_code?: string;
  extra?: Record<string, unknown>;
};

const normalizeUser = (record: SupabaseRecord | null): AppUserRecord | null => {
  if (!record) return null;

  const name = typeof record.name === "string" ? record.name : "";
  const phone = typeof record.phone === "string" ? record.phone : "";
  const role = record.role === "student" || record.role === "parent" || record.role === "teacher" ? record.role : null;

  if (!name || !phone || !role) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    auth_user_id: typeof record.auth_user_id === "string" ? record.auth_user_id : undefined,
    name,
    phone,
    role,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    school_name: typeof record.school_name === "string" ? record.school_name : undefined,
    parent_phone: typeof record.parent_phone === "string" ? record.parent_phone : undefined,
    subjects: Array.isArray(record.subjects) ? record.subjects.filter((item): item is string => typeof item === "string") : undefined,
    student_code: typeof record.student_code === "string" ? record.student_code : undefined,
    extra: record.extra && typeof record.extra === "object" ? (record.extra as Record<string, unknown>) : undefined,
  };
};

const normalizeUserInput = (user: AppUserRecord): AppUserRecord | null => {
  const phone = normalizeEgyptianPhone(user.phone);
  if (!phone) return null;

  const parentPhone = user.parent_phone ? normalizeEgyptianPhone(user.parent_phone) ?? undefined : undefined;

  return {
    ...user,
    phone,
    parent_phone: parentPhone,
  };
};

const buildPayload = (user: AppUserRecord) => ({
  auth_user_id: user.auth_user_id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  stage: user.stage,
  grade: user.grade,
  track: user.track,
  school_name: user.school_name,
  parent_phone: user.parent_phone,
  subjects: user.subjects ?? [],
  student_code: user.student_code,
  extra: user.extra ?? {},
});

export async function fetchUsers(role?: AppUserRole): Promise<AppUserRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.users).select("*");
  if (error || !Array.isArray(data)) return [];
  const normalized = data
    .map((record) => normalizeUser(record as SupabaseRecord))
    .filter((record): record is AppUserRecord => Boolean(record));

  return role ? normalized.filter((record) => record.role === role) : normalized;
}

export async function fetchUserByPhone(phone: string): Promise<AppUserRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedPhone = normalizeEgyptianPhone(phone);
  if (!normalizedPhone) return null;

  const { data, error } = await client.from(supabaseTableNames.users).select("*").eq("phone", normalizedPhone).maybeSingle();
  if (error || !data) return null;

  return normalizeUser(data as SupabaseRecord);
}

export async function createUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedUser = normalizeUserInput(user);
  if (!normalizedUser) return null;

  const { data, error } = await client.from(supabaseTableNames.users).insert(buildPayload(normalizedUser)).select("*").single();
  if (error) return null;
  return normalizeUser(data as SupabaseRecord | null);
}

export async function updateUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  const client = getSupabaseClient();
  if (!client || !user.id) return null;

  const normalizedUser = normalizeUserInput(user);
  if (!normalizedUser) return null;

  const { data, error } = await client
    .from(supabaseTableNames.users)
    .update(buildPayload(normalizedUser))
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return null;
  return normalizeUser(data as SupabaseRecord | null);
}

export async function saveUser(user: AppUserRecord): Promise<AppUserRecord | null> {
  return user.id ? updateUser(user) : createUser(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.from(supabaseTableNames.users).delete().eq("id", id);
  return !error;
}

export function subscribeToUsers(callback: (users: AppUserRecord[]) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel("public:users")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: supabaseTableNames.users,
      },
      async () => {
        const users = await fetchUsers();
        callback(users);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
