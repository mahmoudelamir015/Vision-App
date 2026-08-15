'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, FileEdit, LayoutDashboard, PieChart, User, Users } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchNotifications, type NotificationRecord } from '@/lib/supabase/notifications';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'profile', label: 'حسابي', icon: User },
  { id: 'groups', label: 'الصفوف', icon: Users },
  { id: 'exam-builder', label: 'بناء الامتحان', icon: FileEdit },
  { id: 'content', label: 'المحتوى التعليمي', icon: BookOpen },
  { id: 'reports', label: 'التقارير', icon: PieChart },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]['id']>('dashboard');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notifyStage, setNotifyStage] = useState('');
  const [notifyGrade, setNotifyGrade] = useState('');
  const [notifyTrack, setNotifyTrack] = useState('');

  const stageGrades: Record<string, string[]> = {
    primary: ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'],
    prep: ['الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي'],
    secondary: ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'],
  };

  const secondaryTracks = [
    { value: 'arts', label: 'أدبي' },
    { value: 'science', label: 'علمي علوم' },
    { value: 'math', label: 'علمي رياضة' },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      const rows = await fetchNotifications();
      if (isMounted) {
        setNotifications(rows);
      }
    };

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 border-slate-200 bg-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] text-[#0A2540]">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 text-slate-700">
          {notifications.length} جديدة
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
              stageGrades[notifyStage as keyof typeof stageGrades].map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 text-slate-700">القسم</label>
          <select
            value={notifyTrack}
            onChange={(e) => setNotifyTrack(e.target.value)}
            disabled={!(notifyStage === 'secondary' && (notifyGrade === 'الثاني الثانوي' || notifyGrade === 'الثالث الثانوي'))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition-all disabled:opacity-60 border-slate-200 bg-white"
          >
            <option value="">اختر القسم</option>
            {secondaryTracks.map((track) => (
              <option key={track.value} value={track.value}>
                {track.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, 3).map((notification) => (
            <div key={notification.id ?? notification.title} className="rounded-2xl bg-white p-4 shadow-sm bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0A2540] text-[#0A2540]">{notification.title}</h4>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500 text-slate-500">{notification.body}</p>
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
          description="أي تحديث من الإدارة أو من لوحة الطالب سيظهر هنا بعد تفعيل الربط الكامل."
        />
      )}
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        M
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">المعلم</span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 text-slate-500">لوحة المعلم</span>
      </div>
    </>
  );

  const handleTabChange = (tab: string) => {
    if (tab === 'profile') {
      router.push('/teacher/profile');
      return;
    }
    if (tab === 'content') {
      router.push('/teacher/content');
      return;
    }
    setActiveTab(tab as (typeof navItems)[number]['id']);
  };

  const content = (() => {
    switch (activeTab) {
      case 'groups':
        return (
          <EmptyState
            icon={Users}
            title="لا توجد صفوف مرتبطة حالياً"
            description="الصفوف والطلاب المرتبطين هيتم سحبهم من قاعدة البيانات بعد اكتمال الربط."
          />
        );
      case 'exam-builder':
        return (
          <EmptyState
            icon={FileEdit}
            title="افتح صفحة بناء الامتحان"
            description="من هنا تقدر تنشئ امتحان جديد وتنتقل لشاشة البناء الكاملة."
            actionLabel="فتح الباني"
            onAction={() => router.push('/teacher/exam-builder')}
          />
        );
      case 'content':
        return (
          <EmptyState
            icon={BookOpen}
            title="المحتوى التعليمي"
            description="افتح صفحة المحتوى لإضافة ملفات PDF أو Word وتحديد السعر قبل النشر."
            actionLabel="رفع محتوى جديد"
            onAction={() => router.push('/teacher/content')}
          />
        );
      case 'reports':
        return (
          <EmptyState
            icon={PieChart}
            title="لا توجد تقارير بعد"
            description="التقارير والإحصائيات ستظهر هنا عند تفعيل البيانات الفعلية."
          />
        );
      case 'dashboard':
      default:
        return (
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة المعلم الرئيسية"
            description="من هنا هيظهر كل ما يخص الصفوف والامتحانات والإشعارات بعد اكتمال الربط."
            actionLabel="اذهب إلى بناء الامتحان"
            onAction={() => setActiveTab('exam-builder')}
          />
        );
    }
  })();

  return (
    <DashboardShell
      brandTitle="بوابة المعلم"
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
