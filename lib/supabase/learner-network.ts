import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseTableNames } from "./index";

export type LearnerProfile = {
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
};

export type TeacherLinkRecord = {
  id?: string;
  name: string;
  phone: string;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  school_name?: string | null;
  subjects?: string[] | null;
};

export type FinancialItemRecord = {
  id?: string;
  title: string;
  price: number;
  stage?: string | null;
  grade?: string | null;
  track?: string | null;
  kind: "exam" | "material";
};

const matchesLearner = (item: LearnerProfile & { stage?: string | null; grade?: string | null; track?: string | null }, learner: LearnerProfile) => {
  const stageMatch = !learner.stage || !item.stage || item.stage === learner.stage;
  const gradeMatch = !learner.grade || !item.grade || item.grade === learner.grade;
  const trackMatch = !learner.track || !item.track || item.track === learner.track;
  return stageMatch && gradeMatch && trackMatch;
};

export async function fetchTeachersForLearner(client: SupabaseClient, learner: LearnerProfile): Promise<TeacherLinkRecord[]> {
  const { data, error } = await client
    .from(supabaseTableNames.users)
    .select("id, name, phone, stage, grade, track, school_name, subjects")
    .eq("role", "teacher");

  if (error || !Array.isArray(data)) return [];

  return data.filter((teacher) => matchesLearner(teacher, learner)) as TeacherLinkRecord[];
}

export async function fetchFinancialItemsForLearner(
  client: SupabaseClient,
  learner: LearnerProfile,
): Promise<FinancialItemRecord[]> {
  const [examsResult, materialsResult] = await Promise.all([
    client.from(supabaseTableNames.exams).select("id, title, stage, grade, track, price").gt("price", 0),
    client.from(supabaseTableNames.teacherMaterials).select("id, title, stage, grade, track, price").gt("price", 0),
  ]);

  const exams = Array.isArray(examsResult.data) ? examsResult.data : [];
  const materials = Array.isArray(materialsResult.data) ? materialsResult.data : [];

  const examItems = exams
    .filter((exam) => matchesLearner(exam, learner))
    .map((exam) => ({
      id: exam.id,
      title: exam.title,
      price: Number(exam.price ?? 0),
      stage: exam.stage ?? null,
      grade: exam.grade ?? null,
      track: exam.track ?? null,
      kind: "exam" as const,
    }));

  const materialItems = materials
    .filter((material) => matchesLearner(material, learner))
    .map((material) => ({
      id: material.id,
      title: material.title,
      price: Number(material.price ?? 0),
      stage: material.stage ?? null,
      grade: material.grade ?? null,
      track: material.track ?? null,
      kind: "material" as const,
    }));

  return [...examItems, ...materialItems];
}
