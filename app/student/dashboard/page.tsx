'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bell, FileText, GraduationCap, LayoutDashboard, Trophy, User, Wallet } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchNotifications, type NotificationRecord } from '@/lib/supabase/notifications';
import { fetchPublishedExams, type ExamRecord } from '@/lib/supabase/exams';
import { fetchSystemSettings, subscribeToSystemSettings } from '@/lib/supabase/system-settings';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'profile', label: 'حسابي', icon: User },
  { id: 'my-teachers', label: 'معلموني', icon: GraduationCap },
  { id: 'exams', label: 'الاختبارات', icon: FileText },
  { id: 'archive', label: 'الأرشيف', icon: Archive },
  { id: 'leaderboard', label: 'ترتيب الطلاب', icon: Trophy },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [notifyStage, setNotifyStage] = useState('');
  const [notifyGrade, setNotifyGrade] = useState('');
  const [notifyTrack, setNotifyTrack] = useState('');

  const stageGrades: Record<string, string[]> = {
    primary: ['الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي', 'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي'],
    prep: ['الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي'],
    secondary: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
  };

  const secondaryTracks = [
    { value: 'arts', label: 'أدبي' },
    { value: 'science', label: 'علمي علوم' },
    { value: 'math', label: 'علمي رياضة' },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();
        if (!isMounted) return;
        setWalletEnabled(Boolean(settings?.wallet_enabled));
      } finally {
        if (isMounted) setIsLoadingSettings(false);
      }
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (isMounted) setWalletEnabled(Boolean(settings.wallet_enabled));
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      const [notificationsRows, examRows] = await Promise.all([fetchNotifications(), fetchPublishedExams()]);
      if (!isMounted) return;

      setNotifications(notificationsRows);
      setExams(examRows);
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {notifications.length} جديد
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">المرحلة</label>
          <select
            value={notifyStage}
            onChange={(e) => {
              setNotifyStage(e.target.value);
              setNotifyGrade('');
              setNotifyTrack('');
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">اختر المرحلة</option>
            <option value="primary">ابتدائي</option>
            <option value="prep">إعدادي</option>
            <option value="secondary">ثانوي</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">الصف</label>
          <select
            value={notifyGrade}
            onChange={(e) => setNotifyGrade(e.target.value)}
            disabled={!notifyStage}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">اختر الصف</option>
            {notifyStage &&
              stageGrades[notifyStage as keyof typeof stageGrades].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">القسم</label>
          <select
            value={notifyTrack}
            onChange={(e) => setNotifyTrack(e.target.value)}
            disabled={!(notifyStage === 'secondary' && (notifyGrade === 'الصف الثاني الثانوي' || notifyGrade === 'الصف الثالث الثانوي'))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">اختر القسم</option>
            {secondaryTracks.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, 3).map((notification) => (
            <div key={notification.id ?? notification.title} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0A2540] dark:text-white">{notification.title}</h4>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{notification.body}</p>
                </div>
                <Bell className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="لا توجد إشعارات جديدة"
          description="أي تحديث من الإدارة أو المعلم هيظهر هنا بعد تفعيل الـ Realtime والربط الكامل."
        />
      )}
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        S
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">الطالب</span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">لوحة الطالب</span>
      </div>
    </>
  );

  const handleTabChange = (tab: string) => {
    if (tab === 'profile') {
      router.push('/student/profile');
      return;
    }
    setActiveTab(tab);
  };

  const content = (() => {
    switch (activeTab) {
      case 'my-teachers':
        return (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد قائمة معلمين حالياً"
            description="المعلمين المرتبطين بالمرحلة والصف هيظهروا هنا بعد الربط من قاعدة البيانات."
          />
        );
      case 'exams':
        return exams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <button
                key={exam.id ?? exam.title}
                type="button"
                onClick={() => router.push(`/student/exam-player?examId=${exam.id ?? ''}`)}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0A2540] dark:text-white">{exam.title}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                      {exam.pricing_mode === 'paid' ? 'مدفوع' : 'مجاني'} • {exam.duration_minutes || 0} دقيقة
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {exam.stage ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.stage}</span> : null}
                  {exam.grade ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.grade}</span> : null}
                  {exam.track ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">{exam.track}</span> : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="لا توجد اختبارات منشورة بعد"
            description="هيظهر الاختبار هنا بمجرد حفظه وتفعيله من لوحة المعلم أو الأدمن."
          />
        );
      case 'archive':
        return (
          <EmptyState
            icon={Archive}
            title="لا يوجد أرشيف حتى الآن"
            description="نتائجك وسجل استخدامك هيظهروا هنا بعد تفعيل المتابعة."
          />
        );
      case 'leaderboard':
        return (
          <EmptyState
            icon={Trophy}
            title="لا يوجد ترتيب منشور"
            description="الترتيب العام هيظهر هنا بعد إرساله من لوحة الإدارة."
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
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إعدادات المحفظة</p>
                    <h3 className="text-xl font-extrabold text-[#0A2540] dark:text-white">
                      {isLoadingSettings ? 'جارٍ التحميل...' : walletEnabled ? 'المحفظة مفعلة' : 'المحفظة موقفة'}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
                  {walletEnabled
                    ? 'النظام جاهز لعرض الرصيد والخصم والشحن بعد اكتمال الربط.'
                    : 'أعدّ النظام من إعدادات Supabase قبل تفعيل عمليات الشحن والخصم.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/student/wallet')}
                disabled={!walletEnabled || isLoadingSettings}
                className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-right shadow-sm transition-all hover:border-[#D4AF37] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">المحفظة</p>
                <h3 className="mt-2 text-xl font-extrabold text-[#0A2540] dark:text-white">افتح المحفظة</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  {walletEnabled ? 'شوف الرصيد والعمليات بعد التفعيل.' : 'المحفظة غير متاحة من النظام حالياً.'}
                </p>
              </button>
            </div>

            <EmptyState
              icon={LayoutDashboard}
              title="لوحة الطالب الرئيسية"
              description="من هنا هيتم تجميع الإشعارات والاختبارات والمحفظة وكل بيانات الطالب بعد الربط الكامل."
              actionLabel="تحديث البيانات"
              onAction={() => router.refresh()}
            />
          </div>
        );
    }
  })();

  return (
    <DashboardShell
      brandTitle="بوابة الطالب"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={() => router.push('/')}
      userBadge={userBadge}
      notifications={notificationsPanel}
    >
      <div className="mx-auto max-w-6xl">{content}</div>
    </DashboardShell>
  );
}
