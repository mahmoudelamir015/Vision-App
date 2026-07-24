'use client';

import { useRouter } from 'next/navigation';
import { UserCircle2, CircleDashed } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">الملف الشخصي</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                بيانات الطالب هتتسحب من قاعدة البيانات وتظهر هنا بعد الربط الكامل.
              </p>
            </div>
          </div>
        </header>

        <EmptyState
          icon={CircleDashed}
          title="لا توجد بيانات شخصية حالياً"
          description="الاسم، المرحلة، الصف، والحالة الدراسية هتظهر هنا بعد مزامنة البيانات مع Supabase."
          actionLabel="العودة إلى لوحة الطالب"
          onAction={() => router.push('/student/dashboard')}
        />
      </div>
    </div>
  );
}
