import { getSupabaseClient, supabaseTableNames, type SupabaseRecord } from "./index";
import type { QuestionBankRecord } from "./question-bank";

export type ExamRecord = {
  id?: string;
  title: string;
  stage?: string;
  grade?: string;
  track?: string;
  pricing_mode: "free" | "paid";
  price?: number;
  duration_minutes: number;
  shuffle_questions: boolean;
  published_at?: string;
  ends_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type ExamQuestionRecord = QuestionBankRecord & {
  id?: string;
  exam_id?: string;
  question_order?: number;
};

type SaveExamInput = {
  exam: ExamRecord;
  questions: QuestionBankRecord[];
};

const normalizeExam = (record: SupabaseRecord | null): ExamRecord | null => {
  if (!record) return null;
  const title = typeof record.title === "string" ? record.title : "";
  const pricingMode = record.pricing_mode === "paid" ? "paid" : "free";
  if (!title) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    title,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    grade: typeof record.grade === "string" ? record.grade : undefined,
    track: typeof record.track === "string" ? record.track : undefined,
    pricing_mode: pricingMode,
    price: typeof record.price === "number" ? record.price : Number(record.price ?? 0),
    duration_minutes: typeof record.duration_minutes === "number" ? record.duration_minutes : Number(record.duration_minutes ?? 0),
    shuffle_questions: Boolean(record.shuffle_questions),
    published_at: typeof record.published_at === "string" ? record.published_at : undefined,
    ends_at: typeof record.ends_at === "string" ? record.ends_at : undefined,
    created_at: typeof record.created_at === "string" ? record.created_at : undefined,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : undefined,
  };
};

const normalizeQuestion = (record: SupabaseRecord | null): ExamQuestionRecord | null => {
  if (!record) return null;
  const title = typeof record.title === "string" ? record.title : "";
  const text = typeof record.text === "string" ? record.text : "";
  const type = record.type === "mcq" || record.type === "true_false" ? record.type : null;
  if (!title || !text || !type) return null;

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    exam_id: typeof record.exam_id === "string" ? record.exam_id : undefined,
    question_order: typeof record.question_order === "number" ? record.question_order : Number(record.question_order ?? 0),
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

export async function fetchPublishedExams(): Promise<ExamRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from(supabaseTableNames.exams)
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];
  return data.map((record) => normalizeExam(record as SupabaseRecord)).filter((record): record is ExamRecord => Boolean(record));
}

export async function fetchExamById(id: string): Promise<{ exam: ExamRecord | null; questions: ExamQuestionRecord[] }> {
  const client = getSupabaseClient();
  if (!client) return { exam: null, questions: [] };

  const [examResult, questionsResult] = await Promise.all([
    client.from(supabaseTableNames.exams).select("*").eq("id", id).maybeSingle(),
    client.from(supabaseTableNames.examQuestions).select("*").eq("exam_id", id).order("question_order", { ascending: true }),
  ]);

  const exam = examResult.error ? null : normalizeExam(examResult.data as SupabaseRecord | null);
  const questions =
    questionsResult.error || !Array.isArray(questionsResult.data)
      ? []
      : questionsResult.data.map((record) => normalizeQuestion(record as SupabaseRecord)).filter((record): record is ExamQuestionRecord => Boolean(record));

  return { exam, questions };
}

export async function saveExamWithQuestions(input: SaveExamInput): Promise<ExamRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    title: input.exam.title,
    stage: input.exam.stage ?? null,
    grade: input.exam.grade ?? null,
    track: input.exam.track ?? null,
    pricing_mode: input.exam.pricing_mode,
    price: input.exam.price ?? 0,
    duration_minutes: input.exam.duration_minutes,
    shuffle_questions: input.exam.shuffle_questions,
    published_at: input.exam.published_at ?? null,
    ends_at: input.exam.ends_at ?? null,
  };

  const examResponse = input.exam.id
    ? await client.from(supabaseTableNames.exams).update(payload).eq("id", input.exam.id).select("*").single()
    : await client.from(supabaseTableNames.exams).insert(payload).select("*").single();

  if (examResponse.error || !examResponse.data) return null;

  const exam = normalizeExam(examResponse.data as SupabaseRecord | null);
  if (!exam?.id) return null;

  const questionRows = input.questions.map((question, index) => ({
    exam_id: exam.id,
    question_order: index + 1,
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
  }));

  const deleteResult = await client.from(supabaseTableNames.examQuestions).delete().eq("exam_id", exam.id);
  if (deleteResult.error) return null;

  if (questionRows.length > 0) {
    const questionsResponse = await client.from(supabaseTableNames.examQuestions).insert(questionRows);
    if (questionsResponse.error) return null;
  }

  return exam;
}
