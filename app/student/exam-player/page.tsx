'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ExamPlayerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-cairo dark:bg-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
        <EmptyState
          icon={FileText}
          title="لا توجد امتحانات حالياً"
          description="تمت إزالة بيانات الاختبار التجريبية بالكامل. عند وصول الامتحانات من الـ backend ستظهر هنا تلقائياً مع كل أدوات الحل والمراجعة."
          actionLabel="العودة للوحة الطالب"
          onAction={() => router.push('/student/dashboard')}
        />
      </div>
    </div>
  );
}
