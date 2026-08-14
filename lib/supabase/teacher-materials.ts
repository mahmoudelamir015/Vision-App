import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type TeacherMaterialRecord = {
  id?: string;
  teacher_user_id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_name?: string | null;
  file_type?: string | null;
  price: number;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
};

const normalizeTeacherMaterial = (record: SupabaseRecord | null): TeacherMaterialRecord | null => {
  if (!record) return null;

  const teacherUserId = typeof record.teacher_user_id === "string" ? record.teacher_user_id : "";
  const title = typeof record.title === "string" ? record.title : "";
  const fileUrl = typeof record.file_url === "string" ? record.file_url : "";

  if (!teacherUserId || !title || !fileUrl) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    teacher_user_id: teacherUserId,
    title,
    description: typeof record.description === "string" ? record.description : null,
    file_url: fileUrl,
    file_name: typeof record.file_name === "string" ? record.file_name : null,
    file_type: typeof record.file_type === "string" ? record.file_type : null,
    price: typeof record.price === "number" ? record.price : Number(record.price ?? 0),
    published: typeof record.published === "boolean" ? record.published : Boolean(record.published),
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : undefined,
  };
};

export async function fetchTeacherMaterials(teacherUserId: string): Promise<TeacherMaterialRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from(supabaseTableNames.teacherMaterials)
    .select("*")
    .eq("teacher_user_id", teacherUserId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];

  return data
    .map((record) => normalizeTeacherMaterial(record as SupabaseRecord))
    .filter((record): record is TeacherMaterialRecord => Boolean(record));
}

export async function createTeacherMaterial(input: TeacherMaterialRecord): Promise<TeacherMaterialRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    teacher_user_id: input.teacher_user_id,
    title: input.title,
    description: input.description ?? null,
    file_url: input.file_url,
    file_name: input.file_name ?? null,
    file_type: input.file_type ?? null,
    price: input.price ?? 0,
    published: input.published ?? true,
  };

  const { data, error } = await client.from(supabaseTableNames.teacherMaterials).insert(payload).select("*").single();
  if (error || !data) return null;

  return normalizeTeacherMaterial(data as SupabaseRecord | null);
}
