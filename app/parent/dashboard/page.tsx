'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, CreditCard, LayoutDashboard, MessageCircle } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'attendance', label: 'الحضور', icon: Calendar },
  { id: 'finance', label: 'المالية', icon: CreditCard },
  { id: 'messages', label: 'رسائل المدرسة', icon: MessageCircle },
];

export default function ParentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          0 جديدة
        </span>
      </div>
      <EmptyState
        icon={Bell}
        title="لا توجد إشعارات حالياً"
        description="إشعارات الحضور والدرجات والرسائل ستظهر هنا بعد ربط بيانات ولي الأمر الحقيقية."
      />
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        P
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">ولي الأمر</span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">لوحة ولي الأمر</span>
      </div>
    </>
  );

  const content = (() => {
    switch (activeTab) {
      case 'attendance':
        return (
          <EmptyState
            icon={Calendar}
            title="الحضور والغياب"
            description="هنا ستظهر حالة الحضور اللحظية للطلاب المرتبطين بحساب ولي الأمر."
          />
        );
      case 'finance':
        return (
          <EmptyState
            icon={CreditCard}
            title="البيانات المالية"
            description="سجل المدفوعات والرصيد والفواتير سيظهر بعد الربط الفعلي بقاعدة البيانات."
          />
        );
      case 'messages':
        return (
          <EmptyState
            icon={MessageCircle}
            title="رسائل المدرسة"
            description="رسائل الإدارة والمعلمين ستظهر هنا بعد تفعيل المزامنة والـ Realtime."
          />
        );
      case 'dashboard':
      default:
        return (
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة ولي الأمر"
            description="هنا هتظهر بيانات الأبناء والحضور والدرجات بعد اكتمال الربط بقاعدة البيانات."
            actionLabel="تحديث الصفحة"
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
