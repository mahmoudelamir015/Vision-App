'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bell, Clock, FileText, GraduationCap, LayoutDashboard, Trophy, User, Wallet } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import type { TeacherLinkRecord } from '@/lib/supabase/learner-network';
import { fetchNotifications, type NotificationRecord } from '@/lib/supabase/notifications';
import { fetchPublishedExams, type ExamRecord } from '@/lib/supabase/exams';
import { fetchSystemSettings, subscribeToSystemSettings } from '@/lib/supabase/system-settings';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'attendance', label: 'تسجيل الحضور', icon: Clock },
  { id: 'profile', label: 'حسابي', icon: User },
  { id: 'my-teachers', label: 'المدرسين', icon: GraduationCap },
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
  const [teachers, setTeachers] = useState<TeacherLinkRecord[]>([]);
  const [studentProfile, setStudentProfile] = useState<{
    name?: string;
    stage?: string;
    grade?: string;
    track?: string;
    student_code?: string;
    subjects?: string[];
  } | null>(null);
  const [notifyStage, setNotifyStage] = useState('');
  const [notifyGrade, setNotifyGrade] = useState('');
  const [notifyTrack, setNotifyTrack] = useState('');

  // Dismissed notification IDs (local state for Mark as Read)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dismissNotification = (id: string) => setDismissedIds((prev) => new Set([...prev, id]));

  // Pin attendance states
  const [pin, setPin] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 4) {
      setPinFeedback({ type: 'error', message: 'يرجى إدخال الكود المكون من 4 أرقام كاملاً' });
      return;
    }
    setIsSubmittingPin(true);
    setPinFeedback(null);
    try {
      const response = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pin.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? 'الكود المدخل غير صالح أو انتهت صلاحيته');
      }
      setPinFeedback({ type: 'success', message: 'تم تسجيل حضورك للجلسة بنجاح! شكراً لك.' });
      setPin('');
    } catch (err) {
      setPinFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'تعذر تسجيل الحضور، يرجى المحاولة لاحقاً',
      });
    } finally {
      setIsSubmittingPin(false);
    }
  };

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
      const [examRows, dashboardResponse] = await Promise.all([
        fetchPublishedExams(),
        fetch('/api/student/dashboard', { cache: 'no-store' }),
      ]);
      if (!isMounted) return;

      setExams(examRows);

      const payload = await dashboardResponse.json().catch(() => null);
      if (dashboardResponse.ok && payload) {
        const studentData = payload.student ?? null;
        setTeachers(Array.isArray(payload.teachers) ? payload.teachers : []);
        setStudentProfile(studentData);

        // Now fetch notifications filtered for this student
        const notificationsRows = await fetchNotifications({
          studentCode: studentData?.student_code ?? null,
          stage: studentData?.stage ?? null,
          grade: studentData?.grade ?? null,
          track: studentData?.track ?? null,
        });
        if (isMounted) setNotifications(notificationsRows);
      }
    };

    void loadDashboardData();
    
    // Add real refresh handler
    (window as any).refreshDashboardData = loadDashboardData;

    return () => {
      isMounted = false;
    };
  }, []);

  const notificationsPanel = (
    <div className="border-b border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540]">الإشعارات</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
          {notifications.filter((n) => !dismissedIds.has(n.id ?? '')).length} جديد
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 text-slate-700">المرحلة</label>
          <select
            value={notifyStage}
            onChange={(e) => {
              setNotifyStage(e.target.value);
              setNotifyGrade('');
              setNotifyTrack('');
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all border-slate-200 bg-white"
          >
            <option value="">اختر المرحلة</option>
            <option value="primary">ابتدائي</option>
            <option value="prep">إعدادي</option>
            <option value="secondary">ثانوي</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 text-slate-700">الصف</label>
          <select
            value={notifyGrade}
            onChange={(e) => setNotifyGrade(e.target.value)}
            disabled={!notifyStage}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all disabled:opacity-60 border-slate-200 bg-white"
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
          <label className="mb-1 block text-xs font-bold text-slate-700 text-slate-700">القسم</label>
          <select
            value={notifyTrack}
            onChange={(e) => setNotifyTrack(e.target.value)}
            disabled={!(notifyStage === 'secondary' && (notifyGrade === 'الصف الثاني الثانوي' || notifyGrade === 'الصف الثالث الثانوي'))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all disabled:opacity-60 border-slate-200 bg-white"
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

      {notifications.filter((n) => !dismissedIds.has(n.id ?? '')).length > 0 ? (
        <div className="space-y-3">
          {notifications
            .filter((n) => !dismissedIds.has(n.id ?? ''))
            .slice(0, 5)
            .map((notification) => (
            <div key={notification.id ?? notification.title} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold text-[#0A2540]">{notification.title}</h4>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{notification.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(notification.id ?? notification.title)}
                  className="shrink-0 rounded-full p-1 text-slate-300 hover:text-slate-500"
                  title="إخفاء"
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="لا توجد إشعارات جديدة"
          description="أي تحديث من الإدارة أو المعلم هيظهر هنا فور إرساله."
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
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 text-slate-500">لوحة الطالب</span>
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
        return teachers.length > 0 ? (
          <div className="space-y-4">
            {/* Student allowed subjects banner */}
            {studentProfile?.subjects && studentProfile.subjects.length > 0 ? (
              <div className="rounded-2xl border border-[#D4AF37]/30 bg-amber-50 px-5 py-4 bg-amber-50">
                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">المواد المخصصة لك</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {studentProfile.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-800/40 dark:text-amber-200">{s}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-500 border-slate-200 bg-slate-50">
                ليس لديك مواد مخصصة — يمكنك مشاهدة محتوى كل المواد.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id ?? teacher.phone}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">{teacher.name}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">{teacher.school_name ?? 'مدرسة غير محددة'}</p>
                    </div>
                    <GraduationCap className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 bg-white">المرحلة: {teacher.stage ?? '-'}</div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 bg-white">الصف: {teacher.grade ?? '-'}</div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 bg-white">القسم: {teacher.track ?? '-'}</div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-extrabold text-slate-500 text-slate-500">مواد المدرس:</p>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      {teacher.subjects?.length ? (
                        teacher.subjects.map((subject) => {
                          // highlight subject if it's in student's allowed list
                          const allowed = !studentProfile?.subjects?.length ||
                            studentProfile.subjects.some(s => s.trim().toLowerCase() === subject.trim().toLowerCase());
                          return (
                            <span
                              key={subject}
                              className={`rounded-full px-3 py-1 ${
                                allowed
                                  ? 'bg-emerald-100 text-emerald-800 bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-400 line-through bg-slate-50 dark:text-slate-600'
                              }`}
                            >
                              {subject}
                            </span>
                          );
                        })
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500 bg-slate-50">لا توجد مواد مسجلة</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد قائمة معلمين حالياً"
            description="المعلمين المرتبطين بالمرحلة والصف والقسم هيظهروا هنا تلقائياً بعد الربط من قاعدة البيانات."
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
                className="rounded-[2rem] border border-slate-200 bg-white p-6 text-right shadow-md transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">{exam.title}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
                      {exam.pricing_mode === 'paid' ? 'مدفوع' : 'مجاني'} • {exam.duration_minutes || 0} دقيقة
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 text-slate-500">
                  {exam.stage ? <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{exam.stage}</span> : null}
                  {exam.grade ? <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{exam.grade}</span> : null}
                  {exam.track ? <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{exam.track}</span> : null}
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
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <h2 className="text-xl font-extrabold text-[#0A2540] mb-2">أرشيف الاختبارات</h2>
              <p className="text-sm font-bold text-slate-500">سيظهر هنا سجل الاختبارات التي أديتها مع درجاتك بعد مراجعة النتائج من الإدارة.</p>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <h2 className="text-xl font-extrabold text-[#0A2540] mb-2">ترتيب الطلاب</h2>
              <p className="text-sm font-bold text-slate-500">يُحدّث الترتيب تلقائياً بعد كل اختبار تؤديه. ستجد اسمك ودرجتك النسبية بين زملائك هنا.</p>
            </div>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 text-slate-500">إعدادات المحفظة</p>
                    <h3 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">
                      {isLoadingSettings ? 'جارٍ التحميل...' : walletEnabled ? 'المحفظة مفعلة' : 'المحفظة موقفة'}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-500 text-slate-500">
                  {walletEnabled
                    ? 'النظام جاهز لعرض الرصيد والخصم والشحن بعد اكتمال الربط.'
                    : 'أعدّ النظام من إعدادات Supabase قبل تفعيل عمليات الشحن والخصم.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/student/wallet')}
                disabled={!walletEnabled || isLoadingSettings}
                className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-6 text-right shadow-md transition-all hover:border-[#D4AF37] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="text-sm font-bold text-slate-500 text-slate-500">المحفظة</p>
                <h3 className="mt-2 text-xl font-extrabold text-[#0A2540] text-[#0A2540]">افتح المحفظة</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">
                  {walletEnabled ? 'شوف الرصيد والعمليات بعد التفعيل.' : 'المحفظة غير متاحة من النظام حالياً.'}
                </p>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
                <p className="text-sm font-bold text-slate-500 text-slate-500">المدرسين المرتبطين</p>
                <h3 className="mt-2 text-3xl font-black text-[#0A2540] text-[#0A2540]">{teachers.length}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">
                  {studentProfile ? `${studentProfile.stage ?? '-'} • ${studentProfile.grade ?? '-'}${studentProfile.track ? ` • ${studentProfile.track}` : ''}` : 'بيانات الطالب قيد التحميل'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
                <p className="text-sm font-bold text-slate-500 text-slate-500">الطالب المرتبط</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">{studentProfile?.name ?? 'جاري تحميل البيانات'}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">{studentProfile?.student_code ?? '-'}</p>
              </div>
            </div>

            <EmptyState
              icon={LayoutDashboard}
              title="تم مزامنة بياناتك مع السحابة بنجاح"
              description="إذا واجهت أي تأخير في ظهور المواد والبيانات المحدثة الخاصة بك، يمكنك إعادة تحميل البيانات فوراً."
              actionLabel="تحديث البيانات الآن"
              onAction={() => {
                if ((window as any).refreshDashboardData) {
                  (window as any).refreshDashboardData();
                } else {
                  window.location.reload();
                }
              }}
            />
          </div>
        );
      case 'attendance':
        return (
          <div className="mx-auto max-w-md space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md text-right">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-[#0A2540]">تسجيل حضور الحصة</h2>
              </div>
              <p className="mb-6 text-sm font-bold text-slate-500 leading-6">
                أدخل الكود المكون من 4 أرقام الذي يظهر على الشاشة في السنتر لتسجيل حضورك تلقائياً في قاعدة البيانات.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 4821"
                  className="w-full text-center text-3xl font-mono tracking-widest rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:border-[#D4AF37] focus:bg-white text-slate-900"
                />

                <button
                  type="submit"
                  disabled={isSubmittingPin || pin.trim().length !== 4}
                  className="w-full rounded-2xl bg-[#0A2540] px-4 py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-50 hover:bg-[#123B66]"
                >
                  {isSubmittingPin ? 'جاري التحقق...' : 'تسجيل الحضور'}
                </button>
              </form>

              {pinFeedback ? (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  pinFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {pinFeedback.message}
                </div>
              ) : null}
            </div>
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
