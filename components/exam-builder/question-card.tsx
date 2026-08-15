'use client';

import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import type { Question } from './types';

type QuestionCardProps = {
  question: Question;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onAddOption: (id: string) => void;
  onRemoveOption: (id: string, optionIndex: number) => void;
  onAddToBank?: (id: string) => void;
};

export function QuestionCard({
  question,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
  onAddOption,
  onRemoveOption,
  onAddToBank,
}: QuestionCardProps) {
  const canEditOptions = question.type === 'mcq';
  const canRemoveOption = question.options.length > 2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-vision-navy/10 px-3 py-1.5 text-sm font-bold text-vision-navy dark:bg-vision-gold/15 dark:text-vision-gold">
            {question.type === 'mcq' ? 'اختيار من متعدد' : 'صح وخطأ'}
          </span>
          <span className="font-bold text-slate-400">سؤال {index + 1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onAddToBank ? (
            <button
              type="button"
              onClick={() => onAddToBank(question.id)}
              title="إضافة لبنك الأسئلة"
              className="rounded-lg p-2 text-emerald-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={index === total - 1}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
          <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <textarea
              placeholder="اكتب نص السؤال هنا..."
              className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900"
              value={question.text}
              onChange={(event) => onUpdate(question.id, { text: event.target.value })}
            />
          </div>
          <div className="h-28 w-full flex-shrink-0 sm:w-36">
            <button
              type="button"
              className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-vision-gold hover:bg-vision-gold/5 hover:text-vision-gold dark:border-slate-700 dark:hover:bg-vision-gold/10"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-sm font-bold">إرفاق صورة</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              الإجابات (حدد الدائرة بجانب الإجابة الصحيحة):
            </label>
            {canEditOptions ? (
              <button
                type="button"
                onClick={() => onAddOption(question.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-vision-gold hover:text-vision-gold dark:border-slate-700 dark:bg-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة خيار
              </button>
            ) : null}
          </div>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-3">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctAnswer === optionIndex}
                onChange={() => onUpdate(question.id, { correctAnswer: optionIndex })}
                className="h-5 w-5 flex-shrink-0 cursor-pointer accent-vision-gold"
              />
              <input
                type="text"
                value={option}
                disabled={!canEditOptions}
                onChange={(event) => {
                  if (!canEditOptions) return;
                  const nextOptions = [...question.options];
                  nextOptions[optionIndex] = event.target.value;
                  onUpdate(question.id, { options: nextOptions });
                }}
                placeholder={`الخيار ${optionIndex + 1}`}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold disabled:bg-slate-100 disabled:opacity-80 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800/80"
              />
              {canEditOptions && canRemoveOption ? (
                <button
                  type="button"
                  onClick={() => onRemoveOption(question.id, optionIndex)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="حذف الاختيار"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
            تفسير الإجابة
          </label>
          <textarea
            placeholder="شرح سبب اختيار الإجابة الصحيحة (اختياري)..."
            className="h-20 w-full resize-none rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm outline-none transition-all focus:border-vision-gold focus:ring-1 focus:ring-vision-gold dark:border-slate-700 dark:bg-slate-900/50"
            value={question.explanation}
            onChange={(event) => onUpdate(question.id, { explanation: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
