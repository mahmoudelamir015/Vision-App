"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, FileText, PlayCircle, Save } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchExamById, type ExamQuestionRecord, type ExamRecord } from "@/lib/supabase/exams";
import { saveExamAttempt, type ExamAttemptRecord } from "@/lib/supabase/exam-attempts";

type ExamPlayerClientProps = {
  examId: string;
};

export function ExamPlayerClient({ examId }: ExamPlayerClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exam, setExam] = useState<ExamRecord | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionRecord[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<ExamAttemptRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadExam = async () => {
      if (!examId) {
        setIsLoading(false);
        return;
      }

      const result = await fetchExamById(examId);
      if (!isMounted) return;

      setExam(result.exam);
      setQuestions(result.questions);
      setIsLoading(false);
    };

    void loadExam();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  const handleSubmit = async () => {
    if (!exam?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await saveExamAttempt({ examId: exam.id, answers });
      if (!result) {
        throw new Error("تعذر حفظ نتيجة الامتحان");
      }
      setAttemptResult(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "تعذر حفظ نتيجة الامتحان");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!examId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 font-cairo dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
          <EmptyState
            icon={FileText}
            title="اختيار الامتحان مطلوب"
            description="افتح الامتحان من لوحة الطالب أو من رابط يحتوي على examId عشان يفتح هنا."
            actionLabel="العودة إلى لوحة الطالب"
            onAction={() => router.push("/student/dashboard")}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 font-cairo dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
          <EmptyState icon={PlayCircle} title="جارٍ تحميل الامتحان" description="بنجهز بيانات الامتحان من قاعدة البيانات..." />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 font-cairo dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
          <EmptyState
            icon={CircleDashed}
            title="الامتحان غير موجود"
            description="الـ examId الموجود في الرابط غير صالح أو غير متاح للمستخدم الحالي."
            actionLabel="العودة إلى لوحة الطالب"
            onAction={() => router.push("/student/dashboard")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">{exam.title}</h1>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                    {exam.pricing_mode === "paid" ? "امتحان مدفوع" : "امتحان مجاني"} • {exam.duration_minutes || 0} دقيقة
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/student/dashboard")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              العودة
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            {exam.stage ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.stage}</span> : null}
            {exam.grade ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.grade}</span> : null}
            {exam.track ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.track}</span> : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{questions.length} سؤال</span>
          </div>
        </header>

        <div className="space-y-4">
          {questions.length > 0 ? (
            questions.map((question, index) => {
              const selectedAnswer = answers[question.id ?? `${index}`];

              return (
                <section key={question.id ?? `${question.exam_id}-${index}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-[#0A2540]/5 px-3 py-1 text-sm font-bold text-[#0A2540] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
                      سؤال {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {question.type === "mcq" ? "اختيار من متعدد" : "صح / خطأ"}
                    </span>
                  </div>

                  <p className="text-lg font-extrabold leading-8 text-[#0A2540] dark:text-white">{question.text}</p>

                  <div className="mt-5 space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={`${question.id ?? index}-${optionIndex}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                          selectedAnswer === optionIndex
                            ? "border-[#D4AF37] bg-[#D4AF37]/10"
                            : "border-slate-200 bg-slate-50 hover:border-[#D4AF37]/50 dark:border-white/10 dark:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id ?? index}`}
                          checked={selectedAnswer === optionIndex}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id ?? `${index}`]: optionIndex }))}
                          className="h-4 w-4 accent-[#D4AF37]"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{option}</span>
                      </label>
                    ))}
                  </div>

                  {question.explanation ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">شرح الإجابة</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{question.explanation}</p>
                    </div>
                  ) : null}
                </section>
              );
            })
          ) : (
            <EmptyState
              icon={CircleDashed}
              title="لا توجد أسئلة داخل هذا الامتحان"
              description="الامتحان اتحفظ لكن لسه ما اتضافتش له أسئلة."
            />
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#0A2540] dark:text-white">مراجعة الإجابات</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                الإجابات بتتسجل محليًا حالياً، وبعد الحفظ هتظهر النتيجة مباشرة هنا.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "جارٍ الحفظ..." : "حفظ النتيجة"}
              </button>
              {submitError ? <p className="text-sm font-bold text-red-600 dark:text-red-400">{submitError}</p> : null}
            </div>
          </div>

          {attemptResult ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="text-sm font-extrabold">تم حفظ النتيجة بنجاح</p>
              <p className="mt-1 text-sm font-bold">
                الدرجة: {attemptResult.correct_count}/{attemptResult.total_questions} - {attemptResult.score}% - الإجابات الصحيحة: {attemptResult.correct_count} - الخاطئة: {attemptResult.wrong_count}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
