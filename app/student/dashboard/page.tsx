'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bell, FileText, GraduationCap, LayoutDashboard, Trophy } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';

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
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">
          مساحة الطالب
        </span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          لا توجد بيانات بعد
        </span>
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
            description="عندما تتوفر امتحانات فعلية من النظام ستظهر هنا فوراً، بدون أي بيانات تجريبية."
          />
        );
      case 'archive':
        return (
          <EmptyState
            icon={Archive}
            title="الأرشيف فارغ حالياً"
            description="المراجعات والامتحانات السابقة ستظهر هنا بعد تفعيل الـ backend وتخزين النتائج."
          />
        );
      case 'leaderboard':
        return (
          <EmptyState
            icon={Trophy}
            title="لا توجد لوحة شرف بعد"
            description="ستظهر ترتيبات الطلاب الحقيقية بمجرد توصيل التقييمات والنتائج بالنظام."
          />
        );
      case 'dashboard':
      default:
        return (
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة الطالب جاهزة للبيانات"
            description="تم إزالة كل البيانات الوهمية، والواجهة الآن مستعدة لاستقبال الامتحانات والأنشطة من الـ API."
            actionLabel="تحديث الصفحة عند توفر البيانات"
            onAction={() => router.refresh()}
          />
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
