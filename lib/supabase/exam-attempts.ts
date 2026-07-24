export type ExamAttemptRecord = {
  id?: string;
  exam_id: string;
  student_user_id?: string | null;
  student_name: string;
  student_phone: string;
  answers: Record<string, number>;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  score: number;
  percentage: number;
  submitted_at?: string;
  created_at?: string;
};

type SubmitExamAttemptInput = {
  examId: string;
  answers: Record<string, number>;
};

export async function saveExamAttempt(input: SubmitExamAttemptInput): Promise<ExamAttemptRecord | null> {
  const response = await fetch("/api/student/exam-attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as { attempt?: ExamAttemptRecord; error?: string };
  if (!response.ok || !payload.attempt) return null;

  return payload.attempt;
}
