import { getSupabaseClient } from "./index";

export type Profile = {
  id?: string;
  phone: string;
  name?: string;
  role?: "student" | "teacher" | "parent";
  stage?: string;
  grade?: string;
  track?: string;
  created_at?: string;
};

export async function createProfile(p: Profile): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  // Prevent duplicate profiles by phone (server-side validation)
  const { data: existing, error: fetchErr } = await client.from("profiles").select("*").eq("phone", p.phone).maybeSingle();
  if (fetchErr) return null;
  if (existing) return existing as Profile;

  const { data, error } = await client.from("profiles").insert({
    phone: p.phone,
    name: p.name ?? null,
    role: p.role ?? null,
    stage: p.stage ?? null,
    grade: p.grade ?? null,
    track: p.track ?? null,
  }).select("*").single();
  if (error) return null;
  return data as Profile;
}

export async function fetchProfileByPhone(phone: string): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("profiles").select("*").eq("phone", phone).maybeSingle();
  if (error) return null;
  return data as Profile | null;
}
