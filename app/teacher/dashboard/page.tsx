'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, FileEdit, LayoutDashboard, PieChart, Users } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'groups', label: 'مجموعاتي', icon: Users },
  { id: 'exam-builder', label: 'إنشاء امتحان', icon: FileEdit },
  { id: 'content', label: 'المذكرات والمحتوى', icon: BookOpen },
  { id: 'reports', label: 'التقارير والإحصائيات', icon: PieChart },
] as const;

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]['id']>('dashboard');

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
        description="ستظهر تنبيهات الحضور، الامتحانات، والرسائل هنا بمجرد ربط الـ API."
      />
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        M
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">
          مساحة المعلم
        </span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          لا توجد بيانات بعد
        </span>
      </div>
    </>
  );

  const content = (() => {
    switch (activeTab) {
      case 'groups':
        return (
          <EmptyState
            icon={Users}
            title="لا توجد مجموعات حالياً"
            description="بعد ربط قاعدة البيانات ستظهر هنا مجموعاتك، الطلاب، والإحصائيات الخاصة بكل مجموعة."
          />
        );
      case 'exam-builder':
        return (
          <EmptyState
            icon={FileEdit}
            title="محرر الامتحانات جاهز"
            description="لن يتم عرض أي بيانات وهمية هنا. يمكنك فتح صفحة إنشاء الامتحان لإضافة أول محتوى فعلي لاحقاً."
            actionLabel="فتح صفحة إنشاء الامتحان"
            onAction={() => router.push('/teacher/exam-builder')}
          />
        );
      case 'content':
        return (
          <EmptyState
            icon={BookOpen}
            title="لا يوجد محتوى منشور"
            description="ستظهر المذكرات، الفيديوهات، والملفات التعليمية هنا بعد وصولها من الـ backend."
          />
        );
      case 'reports':
        return (
          <EmptyState
            icon={PieChart}
            title="لا توجد تقارير بعد"
            description="عند توفر البيانات الحقيقية ستظهر الرسوم البيانية والإحصائيات التفصيلية هنا."
          />
        );
      case 'dashboard':
      default:
        return (
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة المعلم جاهزة للبيانات"
            description="تم تنظيف الواجهة من أي بيانات hardcoded، واللوحة الآن مستعدة لاستقبال البيانات الحقيقية من الـ API."
            actionLabel="ابدأ من إنشاء امتحان"
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
      onTabChange={(tab) => setActiveTab(tab as (typeof navItems)[number]['id'])}
      onLogout={() => router.push('/')}
      userBadge={userBadge}
      notifications={notificationsPanel}
    >
      <div className="mx-auto max-w-6xl">{content}</div>
    </DashboardShell>
  );
}
