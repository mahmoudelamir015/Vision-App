'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { Question } from './types';

type QuestionBankModalProps = {
  isOpen: boolean;
  questions: Question[];
  onClose: () => void;
  onImport: (questions: Question[]) => void;
};

export function QuestionBankModal({
  isOpen,
  questions,
  onClose,
  onImport,
}: QuestionBankModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelected = (questionId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(questionId) ? current : [...current, questionId];
      }

      return current.filter((id) => id !== questionId);
    });
  };

  const selectedCount = selectedIds.length;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative z-[61] flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 bg-white/30">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 text-[#0A2540]">
            <BookOpen className="h-6 w-6 text-vision-navy text-[#D4AF37]" />
            بنك الأسئلة والمراجعة
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {questions.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="بنك الأسئلة فارغ حالياً"
              description="لن تظهر أسئلة وهمية هنا. بعد ربط الـ backend ستظهر الأسئلة الجاهزة للاستيراد مباشرة."
            />
          ) : (
            questions.map((question) => (
              <label
                key={question.id}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                  selectedIds.includes(question.id)
                    ? 'border-vision-gold bg-vision-gold/5 shadow-sm bg-[#D4AF37]/10'
                    : 'border-slate-100 hover:border-vision-gold/40 dark:border-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(question.id)}
                  onChange={(event) => toggleSelected(question.id, event.target.checked)}
                  className="mt-1 h-5 w-5 cursor-pointer rounded accent-vision-gold"
                />
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 bg-white text-slate-700">
                      {question.type === 'mcq' ? 'اختيار من متعدد' : 'صح وخطأ'}
                    </span>
                  </div>
                  <p className="mb-4 text-lg font-bold text-slate-800 text-slate-800">
                    {question.text}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`rounded-lg border px-3 py-2 ${
                          optionIndex === question.correctAnswer
                            ? 'border-green-200 bg-green-50 font-bold text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'border-slate-100 bg-slate-50 text-slate-600 border-slate-200 bg-white/50 text-slate-500'
                        }`}
                      >
                        {option}
                        {optionIndex === question.correctAnswer ? (
                          <CheckCircle2 className="ml-2 inline-block h-4 w-4 opacity-80" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 bg-white/50">
          <span className="font-bold text-slate-600 text-slate-700">
            تم تحديد <span className="text-vision-navy text-[#D4AF37]">{selectedCount}</span>{' '}
            سؤال
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-200 text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                onImport(questions.filter((question) => selectedIds.includes(question.id)));
                setSelectedIds([]);
                onClose();
              }}
              disabled={selectedCount === 0}
              className="rounded-xl bg-vision-navy px-6 py-2.5 font-bold text-white shadow-md transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 bg-[#D4AF37] dark:text-vision-navy dark:hover:bg-vision-gold-hover"
            >
              إدراج الأسئلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
