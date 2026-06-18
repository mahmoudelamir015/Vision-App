'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CircleDashed } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchSystemSettings, subscribeToSystemSettings } from '@/lib/supabase/system-settings';

export default function StudentWalletPage() {
  const router = useRouter();
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('appUserRole');
        setUserRole(role);
      }
    } catch (e) {}

    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();

        if (!isMounted) return;

        setWalletEnabled(Boolean(settings?.wallet_enabled));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (isMounted) {
        setWalletEnabled(Boolean(settings.wallet_enabled));
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (userRole && userRole !== 'student') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            icon={CircleDashed}
            title="هذه الصفحة مخصصة للطلاب فقط"
            description="ليس لديك صلاحية لعرض المحفظة. سجّل الدخول كطالب للوصول إلى هذه الصفحة."
            actionLabel="العودة للصفحة الرئيسية"
            onAction={() => router.push('/')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">محفظتي</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                {isLoading
                  ? 'جارٍ التحقق من حالة المحفظة من Supabase...'
                  : walletEnabled
                    ? 'المحفظة متاحة حالياً، والبيانات الفعلية ستظهر هنا بعد الربط.'
                    : 'المحفظة مخفية حالياً من غرفة العمليات.'}
              </p>
            </div>
          </div>
        </header>

        {walletEnabled ? (
          <EmptyState
            icon={CircleDashed}
            title="لا توجد بيانات مالية حالياً"
            description="بعد الربط بالـ API ستظهر هنا أرصدة الطالب، سجل الشحن، والعمليات المالية مباشرة."
            actionLabel="العودة للوحة الطالب"
            onAction={() => router.push('/student/dashboard')}
          />
        ) : (
          <EmptyState
            icon={CircleDashed}
            title="المحفظة غير متاحة حالياً"
            description="المدير قفل المحفظة من system_settings، لذلك الواجهة مخفية إلى أن يتم تفعيلها من غرفة العمليات."
            actionLabel="العودة للوحة الطالب"
            onAction={() => router.push('/student/dashboard')}
          />
        )}
      </div>
    </div>
  );
}
