'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, Clock, Plus, Save, Settings, Shuffle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { QuestionBankModal } from '@/components/exam-builder/question-bank-modal';
import { QuestionCard } from '@/components/exam-builder/question-card';
import type { Question, QuestionType } from '@/components/exam-builder/types';
import { triggerConfetti } from '@/lib/confetti';
import { saveExamWithQuestions } from '@/lib/supabase/exams';
import { fetchQuestionBank, saveQuestionBankQuestion } from '@/lib/supabase/question-bank';

const EMPTY_QUESTION_BANK: Question[] = [];

const createQuestion = (type: QuestionType): Question => ({
  id: `${type}-${Date.now()}-${Math.random()}`,
  type,
  text: '',
  options: type === 'mcq' ? ['', '', '', ''] : ['صح', 'خطأ'],
  correctAnswer: 0,
  explanation: '',
});

export default function ExamBuilderPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [pricingMode, setPricingMode] = useState<'free' | 'paid'>('free');
  const [examPrice, setExamPrice] = useState('0');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuestionBank = async () => {
      const questionsFromBank = await fetchQuestionBank();
      if (!isMounted) return;

      setBankQuestions(
        questionsFromBank.map((question) => ({
          id: question.id ?? `${question.type}-${question.text.slice(0, 12)}`,
          type: question.type,
          text: question.text,
          imageUrl: question.imageUrl,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation ?? '',
        })),
      );
    };

    void loadQuestionBank();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (questions.length === 0) {
      hasCelebratedRef.current = false;
      return;
    }

    if (!hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      void triggerConfetti();
    }
  }, [questions.length]);

  const addQuestion = (type: QuestionType) => {
    setQuestions((current) => [...current, createQuestion(type)]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...updates } : question)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setQuestions((current) => {
      if (direction === 'up' && index === 0) return current;
      if (direction === 'down' && index === current.length - 1) return current;

      const next = [...current];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const addQuestionOption = (id: string) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== id || question.type !== 'mcq') return question;
        return { ...question, options: [...question.options, ''] };
      }),
    );
  };

  const removeQuestionOption = (id: string, optionIndex: number) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== id || question.type !== 'mcq' || question.options.length <= 2) return question;
        const nextOptions = question.options.filter((_, index) => index !== optionIndex);
        const nextCorrectAnswer = Math.min(question.correctAnswer, nextOptions.length - 1);
        return {
          ...question,
          options: nextOptions,
          correctAnswer: Math.max(0, nextCorrectAnswer),
        };
      }),
    );
  };

  const handleBankImport = (importedQuestions: Question[]) => {
    const safeImports = importedQuestions.map((question) => ({
      ...question,
      id: `imported-${Date.now()}-${Math.random()}`,
    }));

    setQuestions((current) => [...current, ...safeImports]);
  };

    const handleAddToBank = async (questionId: string) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    try {
      await saveQuestionBankQuestion({
        title: q.text.slice(0, 50) || 'بدون عنوان',
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        stage: selectedStage || undefined,
        grade: selectedGrade || undefined,
        published: true
      });
      alert('تمت إضافة السؤال لبنك الأسئلة بنجاح!');
    } catch {
      alert('فشل إضافة السؤال!');
    }
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim() || questions.length === 0) {
      setSaveState('error');
      setSaveMessage('اكتب عنوان الامتحان واضف سؤال واحد على الاقل.');
      return;
    }

    setSaveState('saving');
    setSaveMessage('');

    const savedExam = await saveExamWithQuestions({
      exam: {
        title: examTitle.trim(),
        stage: selectedStage || undefined,
        grade: selectedGrade || undefined,
        track: undefined,
        pricing_mode: pricingMode,
        price: Number(examPrice || 0),
        duration_minutes: Number(durationMinutes || 0),
        shuffle_questions: shuffleQuestions,
        published_at: publishedAt || undefined,
        ends_at: endsAt || undefined,
      },
      questions: questions.map((question) => ({
        title: question.text || 'سؤال',
        type: question.type,
        text: question.text,
        imageUrl: question.imageUrl,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      })),
    });

    if (!savedExam) {
      setSaveState('error');
      setSaveMessage('فشل حفظ الامتحان. راجع صلاحيات قاعدة البيانات او الـ RLS.');
      return;
    }

    setSaveState('saved');
    setSaveMessage(`تم حفظ الامتحان بنجاح بعنوان: ${savedExam.title}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-vision-navy dark:text-vision-gold">بناء الامتحان</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              أنشئ الامتحان، اختار المرحلة والصف، وحدد مجاني او مدفوع ثم احفظه في قاعدة البيانات.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              رجوع
            </button>
            <button
              type="button"
              onClick={() => setIsBankOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <BookOpen className="h-5 w-5" />
              بنك الاسئلة
            </button>
            <button
              type="button"
              onClick={() => void handleSaveExam()}
              disabled={saveState === 'saving' || questions.length === 0 || !examTitle.trim()}
              className="flex items-center gap-2 rounded-xl bg-vision-navy px-6 py-2.5 font-bold text-white shadow-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-60 dark:bg-vision-gold dark:text-vision-navy"
            >
              <Save className="h-5 w-5" />
              {saveState === 'saving' ? 'جاري الحفظ...' : 'حفظ الامتحان'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="sticky top-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
              <Settings className="h-5 w-5 text-vision-navy dark:text-vision-gold" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">اعدادات الامتحان</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">عنوان الامتحان</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(event) => setExamTitle(event.target.value)}
                  placeholder="اكتب اسم الامتحان هنا"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">نظام الامتحان</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setPricingMode('free')}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      pricingMode === 'free'
                        ? 'bg-vision-navy text-white dark:bg-vision-gold dark:text-vision-navy'
                        : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    مجاني
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('paid')}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      pricingMode === 'paid'
                        ? 'bg-vision-navy text-white dark:bg-vision-gold dark:text-vision-navy'
                        : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    مدفوع
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">سعر الامتحان</label>
                <input
                  type="number"
                  min="0"
                  value={examPrice}
                  onChange={(event) => setExamPrice(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                />
                <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">0 يعني مجاني، واي رقم اكبر من 0 يعني مدفوع.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">المرحلة الدراسية</label>
                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">اختر المرحلة</option>
                  <option value="primary">ابتدائي</option>
                  <option value="prep">اعدادي</option>
                  <option value="secondary">ثانوي</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">اختر الصف</option>
                  <option value="1">الصف الاول</option>
                  <option value="2">الصف الثاني</option>
                  <option value="3">الصف الثالث</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(event) => setShuffleQuestions(event.target.checked)}
                  className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-vision-gold transition-all dark:border-slate-600"
                />
                <span className="flex select-none items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Shuffle className="h-4 w-4 text-slate-400" />
                  خلط ترتيب الاسئلة
                </span>
              </label>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">المدة بالدقائق (اختياري)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    placeholder="اكتب مدة الامتحان"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                  />
                  <Clock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {pricingMode === 'paid' ? (
                <div className="rounded-2xl border border-dashed border-vision-gold/40 bg-vision-gold/5 p-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">الامتحان مدفوع، وسيمكن نشره بعد ربطه بآلية الدفع المناسبة.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-700">الامتحان مجاني وجاهز للنشر بعد الحفظ.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">تاريخ النشر</label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs outline-none transition-all focus:border-vision-gold dark:border-slate-700 dark:bg-slate-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">تاريخ الاغلاق</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs outline-none transition-all focus:border-vision-gold dark:border-slate-700 dark:bg-slate-900 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {questions.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="ابدأ بإضافة سؤال"
                description="استخدم الازرار التالية لإضافة سؤال اختيار من متعدد او سؤال صح وخطأ."
                actionLabel="إضافة سؤال"
                onAction={() => addQuestion('mcq')}
              />
            ) : null}

            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                total={questions.length}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onMove={moveQuestion}
                onAddOption={addQuestionOption}
                onRemoveOption={removeQuestionOption}
                onAddToBank={handleAddToBank}
              />
            ))}

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => addQuestion('mcq')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vision-navy/30 py-4 font-bold text-vision-navy transition-all hover:border-vision-navy hover:bg-vision-navy/5 dark:border-vision-gold/30 dark:text-vision-gold dark:hover:border-vision-gold dark:hover:bg-vision-gold/5"
              >
                <Plus className="h-5 w-5" />
                إضافة سؤال MCQ
              </button>
              <button
                type="button"
                onClick={() => addQuestion('true_false')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vision-navy/30 py-4 font-bold text-vision-navy transition-all hover:border-vision-navy hover:bg-vision-navy/5 dark:border-vision-gold/30 dark:text-vision-gold dark:hover:border-vision-gold dark:hover:bg-vision-gold/5"
              >
                <Plus className="h-5 w-5" />
                إضافة سؤال صح/خطأ
              </button>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0A2540]/40">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[#0A2540] dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                جاهز للحفظ
              </h3>
              <p className="text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
                بعد ربط الحفظ الحقيقي بقاعدة البيانات، هتقدر تنشر الامتحان وتتابع حالة الدفع او المجانية.
              </p>
              {saveMessage ? (
                <p
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
                    saveState === 'error'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  }`}
                >
                  {saveMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isBankOpen ? (
        <QuestionBankModal
          isOpen={isBankOpen}
          questions={bankQuestions.length > 0 ? bankQuestions : EMPTY_QUESTION_BANK}
          onClose={() => setIsBankOpen(false)}
          onImport={handleBankImport}
        />
      ) : null}
    </div>
  );
}
