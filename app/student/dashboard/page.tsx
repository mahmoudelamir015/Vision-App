'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bell, FileText, GraduationCap, LayoutDashboard, Trophy, Wallet } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchSystemSettings } from '@/lib/supabase/system-settings';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'my-teachers', label: 'أساتذتي', icon: GraduationCap },
  { id: 'exams', label: 'منصة التدريب', icon: FileText },
  { id: 'archive', label: 'الأرشيف والمراجعة', icon: Archive },
  { id: 'leaderboard', label: 'لوحة الشرف', icon: Trophy },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();

        if (!isMounted) return;

        setWalletEnabled(Boolean(settings?.wallet_enabled));
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          0 جديد
        </span>
      </div>
      <EmptyState
        icon={Bell}
        title="لا توجد إشعارات حالياً"
        description="تنبيهات الامتحانات، الحضور، والرسائل ستظهر هنا بعد اتصال الواجهة بالـ API."
      />
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        S
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">مساحة الطالب</span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">لا توجد بيانات بعد</span>
      </div>
    </>
  );

  const content = (() => {
    switch (activeTab) {
      case 'my-teachers':
        return (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد أساتذة مرتبطون حالياً"
            description="سيظهر هنا ملف كل معلم، الدروس، والمحتوى المرتبط به بعد وصول البيانات الحقيقية."
          />
        );
      case 'exams':
        return (
          <EmptyState
            icon={FileText}
            title="لا توجد امتحانات حالياً"
            description="عند توفر امتحانات فعلية من النظام ستظهر هنا مباشرة بدون أي بيانات تجريبية."
          />
        );
      case 'archive':
        return (
          <EmptyState
            icon={Archive}
            title="الأرشيف فارغ حالياً"
            description="المراجعات والامتحانات السابقة ستظهر هنا بعد تجهيز الـ backend وحفظ النتائج."
          />
        );
      case 'leaderboard':
        return (
          <EmptyState
            icon={Trophy}
            title="لا توجد لوحة شرف بعد"
            description="ترتيب الطلاب سيظهر هنا بمجرد توصيل التقييمات والنتائج بالنظام."
          />
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">حالة المحفظة</p>
                    <h3 className="text-xl font-extrabold text-[#0A2540] dark:text-white">
                      {isLoadingSettings ? 'جارٍ التحميل...' : walletEnabled ? 'المحفظة ظاهرة' : 'المحفظة مخفية'}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
                  {walletEnabled
                    ? 'المحفظة متاحة الآن للطلاب، وزر الدخول ظاهر من هنا ومن صفحة المحفظة.'
                    : 'المدير قفل المحفظة من جدول system_settings، فهنخفي الوصول المباشر لحد ما تتفعل تاني.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/student/wallet')}
                disabled={!walletEnabled || isLoadingSettings}
                className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-right shadow-sm transition-all hover:border-[#D4AF37] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">اختصار سريع</p>
                <h3 className="mt-2 text-xl font-extrabold text-[#0A2540] dark:text-white">فتح صفحة المحفظة</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  {walletEnabled ? 'اضغط هنا للوصول إلى سجل المحفظة والعمليات.' : 'الاختصار معطل لأن المحفظة مخفية حالياً.'}
                </p>
              </button>
            </div>

            <EmptyState
              icon={LayoutDashboard}
              title="لوحة الطالب جاهزة للبيانات"
              description="تم إزالة كل البيانات الوهمية، والواجهة الآن مستعدة لاستقبال الامتحانات والأنشطة والإشعارات الحقيقية من الـ API."
              actionLabel="تحديث الصفحة عند توفر البيانات"
              onAction={() => router.refresh()}
            />
          </div>
        );
    }
  })();

  return (
    <DashboardShell
      brandTitle="سنتر رؤية"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => router.push('/')}
      userBadge={userBadge}
      notifications={notificationsPanel}
    >
      <div className="mx-auto max-w-6xl">{content}</div>
    </DashboardShell>
  );
}
