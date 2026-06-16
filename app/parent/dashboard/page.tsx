'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, CreditCard, LayoutDashboard, MessageCircle } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'attendance', label: 'تقارير الحضور', icon: Calendar },
  { id: 'finance', label: 'الماليات والرسوم', icon: CreditCard },
  { id: 'messages', label: 'التواصل مع الإدارة', icon: MessageCircle },
];

export default function ParentDashboard() {
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
        description="ستظهر هنا التنبيهات الخاصة بالحضور، الرسوم، والرسائل بمجرد توصيل البيانات الفعلية."
      />
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        P
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">
          مساحة ولي الأمر
        </span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          لا توجد بيانات بعد
        </span>
      </div>
    </>
  );

  const content = (() => {
    switch (activeTab) {
      case 'attendance':
        return (
          <EmptyState
            icon={Calendar}
            title="لا توجد تقارير حضور حالياً"
            description="سيظهر هنا سجل الحضور والغياب بعد ربط الواجهة بقاعدة البيانات."
          />
        );
      case 'finance':
        return (
          <EmptyState
            icon={CreditCard}
            title="لا توجد بيانات مالية بعد"
            description="سيتم عرض الرسوم، الأقساط، وإيصالات الدفع هنا عندما يصبح الـ backend متاحاً."
          />
        );
      case 'messages':
        return (
          <EmptyState
            icon={MessageCircle}
            title="لا توجد رسائل حالياً"
            description="التواصل مع الإدارة والمعلمين سيظهر هنا بعد تفعيل نظام الرسائل."
          />
        );
      case 'dashboard':
      default:
        return (
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة ولي الأمر جاهزة للبيانات"
            description="تم حذف جميع البيانات الوهمية، والصفحة أصبحت جاهزة لاستقبال بيانات الأبناء من الـ API."
            actionLabel="تحديث الصفحة عند توفر البيانات"
            onAction={() => router.refresh()}
          />
        );
    }
  })();

  return (
    <DashboardShell
      brandTitle="بوابة ولي الأمر"
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
