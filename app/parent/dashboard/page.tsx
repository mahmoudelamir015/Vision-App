'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, CreditCard, LayoutDashboard, MessageCircle, User } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/dashboard-shell';
import { EmptyState } from '@/components/ui/empty-state';
import type { TeacherLinkRecord } from '@/lib/supabase/learner-network';

type ParentDashboardData = {
  child?: {
    id?: string;
    name?: string;
    phone?: string;
    stage?: string;
    grade?: string;
    track?: string;
    student_code?: string;
  } | null;
  financialItems?: Array<{
    id?: string;
    title: string;
    price: number;
    stage?: string;
    grade?: string;
    track?: string;
    kind: string;
  }>;
  teachers?: TeacherLinkRecord[];
};

const navItems: DashboardNavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'profile', label: 'حسابي', icon: User },
  { id: 'attendance', label: 'الحضور', icon: Calendar },
  { id: 'finance', label: 'المالية', icon: CreditCard },
  { id: 'messages', label: 'رسائل المدرسة', icon: MessageCircle },
];

export default function ParentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<ParentDashboardData>({});

  const handleTabChange = (tab: string) => {
    if (tab === 'profile') {
      router.push('/parent/profile');
      return;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const response = await fetch('/api/parent/dashboard', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as ParentDashboardData & { error?: string } | null;
      if (!isMounted || !response.ok) return;
      setDashboardData({
        child: payload?.child ?? null,
        financialItems: payload?.financialItems ?? [],
        teachers: payload?.teachers ?? [],
      });
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const child = dashboardData.child ?? null;
  const financialItems = dashboardData.financialItems ?? [];
  const teachers = dashboardData.teachers ?? [];
  const totalDue = financialItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 border-slate-200 bg-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] text-[#0A2540]">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 text-slate-700">
          0 جديدة
        </span>
      </div>
      <EmptyState
        icon={Bell}
        title="لا توجد إشعارات حالياً"
        description="إشعارات الحضور والدرجات والرسائل ستظهر هنا بعد الربط الكامل."
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
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 text-slate-500">لوحة ولي الأمر</span>
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
            description="هنا ستظهر حالة حضور الطالب بشكل مباشر بعد اكتمال الربط."
          />
        );
      case 'finance':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 border-slate-200 bg-slate-50">
                <p className="text-sm font-bold text-slate-500 text-slate-500">إجمالي المطلوب</p>
                <h3 className="mt-2 text-3xl font-black text-[#0A2540] text-[#0A2540]">{totalDue} جنيه</h3>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-slate-50">
                <p className="text-sm font-bold text-slate-500 text-slate-500">الطالب المرتبط</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">{child?.name ?? 'لم يتم الربط بعد'}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">{child?.student_code ?? '-'}</p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-slate-50">
                <p className="text-sm font-bold text-slate-500 text-slate-500">الوضع</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">عرض فقط</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">لا يوجد دفع أونلاين داخل هذه اللوحة.</p>
              </div>
            </div>

            {financialItems.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {financialItems.map((item) => (
                  <div key={item.id ?? `${item.kind}-${item.title}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">{item.title}</h4>
                        <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">
                          {item.stage ? `${item.stage}` : 'عام'} {item.grade ? `• ${item.grade}` : ''} {item.track ? `• ${item.track}` : ''}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                        <p className="text-xs font-bold text-amber-700">مطلوب</p>
                        <p className="mt-1 text-2xl font-black text-amber-700">{item.price} جنيه</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CreditCard}
                title="لا توجد مبالغ مطلوبة حالياً"
                description="لو ظهر امتحان أو محتوى مدفوع للطالب هيتضاف هنا في صورة كروت مالية."
              />
            )}
          </div>
        );
      case 'messages':
        return (
          <EmptyState
            icon={MessageCircle}
            title="رسائل المدرسة"
            description="رسائل المدرسة والإدارة ستظهر هنا بعد تفعيل المراسلة."
          />
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-slate-50">
                <h3 className="text-xl font-extrabold text-[#0A2540] text-[#0A2540]">مرحبا بك</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-500 text-slate-500">
                  من هنا تقدر تتابع حالة الطالب، وتشوف أي مبالغ مطلوبة بشكل واضح ومباشر بدون أي دفع أونلاين.
                </p>
              </div>

              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6 border-slate-200 bg-slate-50">
                <p className="text-sm font-bold text-slate-500 text-slate-500">الطالب المرتبط</p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">{child?.name ?? 'لم يتم الربط بعد'}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">
                  {child ? `${child.stage ?? '-'} • ${child.grade ?? '-'}${child.track ? ` • ${child.track}` : ''}` : 'انتظر ربط الحساب من الإدارة'}
                </p>
              </div>
            </div>

            {teachers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">المدرسين المرتبطين</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
                      المدرسين هنا بيظهروا حسب نفس المرحلة والصف والقسم.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 bg-slate-50 text-slate-700">
                    {teachers.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {teachers.slice(0, 4).map((teacher) => (
                    <div
                      key={teacher.id ?? teacher.phone}
                      className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm border-slate-200 bg-slate-50"
                    >
                      <h4 className="text-base font-extrabold text-[#0A2540] text-[#0A2540]">{teacher.name}</h4>
                      <p className="mt-2 text-sm font-bold text-slate-500 text-slate-500">
                        {teacher.school_name ?? 'مدرسة غير محددة'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500 text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{teacher.stage ?? '-'}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{teacher.grade ?? '-'}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 bg-slate-50">{teacher.track ?? '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <EmptyState
              icon={LayoutDashboard}
              title="لوحة ولي الأمر"
              description="هنا ستجد متابعة الطالب والمصاريف المطلوبة في شكل كروت مالية للعرض فقط."
              actionLabel="تحديث الصفحة"
              onAction={() => router.refresh()}
            />
          </div>
        );
    }
  })();

  return (
    <DashboardShell
      brandTitle="بوابة ولي الأمر"
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
