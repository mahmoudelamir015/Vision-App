import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";

export type QuestionType = "mcq" | "true_false";

export type QuestionBankRecord = {
  id?: string;
  title: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  stage?: string;
  grade?: string;
  track?: string;
  subject?: string;
  published?: boolean;
  createdAt?: string;
};

const normalize = (record: SupabaseRecord | null): QuestionBankRecord | null => {
  if (!record) return null;
  const title = typeof record.title === "string" ? record.title : "";
  const text = typeof record.text === "string" ? record.text : "";
  const type = record.type === "mcq" || record.type === "true_false" ? record.type : null;
  if (!title || !text || !type) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    title,
    type,
    text,
    imageUrl: typeof record.image_url === "string" ? record.image_url : undefined,
    options: Array.isArray(record.options) ? record.options.filter((item): item is string => typeof item === "string") : [],
    correctAnswer: typeof record.correct_answer === "number" ? record.correct_answer : Number(record.correct_answer ?? 0),
    explanation: typeof record.explanation === "string" ? record.explanation : undefined,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    subject: typeof record.subject === "string" ? record.subject : undefined,
    published: typeof record.published === "boolean" ? record.published : undefined,
    createdAt: typeof record.created_at === "string" ? record.created_at : undefined,
  };
};

export async function fetchQuestionBank(): Promise<QuestionBankRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(supabaseTableNames.questionBank).select("*").order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];

  return data.map((record) => normalize(record as SupabaseRecord)).filter((record): record is QuestionBankRecord => Boolean(record));
}

export async function saveQuestionBankQuestion(question: QuestionBankRecord): Promise<QuestionBankRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    title: question.title,
    type: question.type,
    text: question.text,
    image_url: question.imageUrl ?? null,
    options: question.options ?? [],
    correct_answer: question.correctAnswer,
    explanation: question.explanation ?? null,
    stage: question.stage ?? null,
    grade: question.grade ?? null,
    track: question.track ?? null,
    subject: question.subject ?? null,
    published: question.published ?? true,
    created_at: question.createdAt ?? new Date().toISOString(),
  };

  const { data, error } = await client.from(supabaseTableNames.questionBank).insert(payload).select("*").single();
  if (error) return null;
  return normalize(data as SupabaseRecord | null);
}
