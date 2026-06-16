'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Settings,
  Shuffle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { QuestionBankModal } from '@/components/exam-builder/question-bank-modal';
import { QuestionCard } from '@/components/exam-builder/question-card';
import type { Question, QuestionType } from '@/components/exam-builder/types';
import { triggerConfetti } from '@/lib/confetti';

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
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const hasCelebratedRef = useRef(false);

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
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...updates } : question)),
    );
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
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleBankImport = (importedQuestions: Question[]) => {
    const safeImports = importedQuestions.map((question) => ({
      ...question,
      id: `imported-${Date.now()}-${Math.random()}`,
    }));

    setQuestions((current) => [...current, ...safeImports]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-vision-navy dark:text-vision-gold">
              نظام إنشاء الامتحانات
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              الواجهة الآن نظيفة وجاهزة لربطها ببيانات الامتحانات الحقيقية من الـ API.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsBankOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <BookOpen className="h-5 w-5" />
              بنك الأسئلة
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-xl bg-vision-navy px-6 py-2.5 font-bold text-white opacity-60 shadow-lg dark:bg-vision-gold dark:text-vision-navy"
            >
              <Save className="h-5 w-5" />
              الحفظ والنشر بعد الربط
            </button>
          </div>
        </header>

        <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="sticky top-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
              <Settings className="h-5 w-5 text-vision-navy dark:text-vision-gold" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">إعدادات الامتحان</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  عنوان الامتحان
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(event) => setExamTitle(event.target.value)}
                  placeholder="سيتم ملؤه من البيانات الحقيقية لاحقاً"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  المرحلة الدراسية
                </label>
                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">سيتم تحميل المراحل من الـ API</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  الصف الدراسي
                </label>
                <select
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">سيظهر بعد اختيار المرحلة</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3 pt-2 group">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(event) => setShuffleQuestions(event.target.checked)}
                  className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-vision-gold transition-all dark:border-slate-600"
                />
                <span className="flex select-none items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Shuffle className="h-4 w-4 text-slate-400" />
                  عشوائية ترتيب الأسئلة
                </span>
              </label>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  مدة الامتحان (بالدقائق)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    placeholder="سيتم تحديدها من الإعدادات الحقيقية"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
                  />
                  <Clock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    تاريخ الفتح
                  </label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs outline-none transition-all focus:border-vision-gold dark:border-slate-700 dark:bg-slate-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    تاريخ الإغلاق
                  </label>
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
            <AnimatePresence mode="popLayout">
              {questions.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="لا توجد أسئلة بعد"
                  description="الصفحة خالية من أي بيانات وهمية. أضف أول سؤال الآن أو افتح بنك الأسئلة عندما يصبح متاحاً من الـ API."
                  actionLabel="إضافة أول سؤال"
                  onAction={() => addQuestion('mcq')}
                />
              ) : null}

              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuestionCard
                    question={question}
                    index={index}
                    total={questions.length}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    onMove={moveQuestion}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => addQuestion('mcq')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vision-navy/30 py-4 font-bold text-vision-navy transition-all hover:border-vision-navy hover:bg-vision-navy/5 dark:border-vision-gold/30 dark:text-vision-gold dark:hover:border-vision-gold dark:hover:bg-vision-gold/5"
              >
                <Plus className="h-5 w-5" />
                إضافة سؤال اختياري
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
                جاهز للربط
              </h3>
              <p className="text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
                تم تنظيف المحرر من أي بيانات hardcoded، وأصبح يعتمد بالكامل على state محلي فارغ
                حتى يتصل بالـ backend لاحقاً.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isBankOpen ? (
        <QuestionBankModal
          isOpen={isBankOpen}
          questions={EMPTY_QUESTION_BANK}
          onClose={() => setIsBankOpen(false)}
          onImport={handleBankImport}
        />
      ) : null}
    </div>
  );
}
