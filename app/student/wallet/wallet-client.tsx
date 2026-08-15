"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDashed, CreditCard, Wallet } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchSystemSettings, subscribeToSystemSettings } from "@/lib/supabase/system-settings";
import { fetchWalletEntries, subscribeToWalletEntries, type WalletEntry } from "@/lib/supabase/wallets";

type StudentWalletClientProps = {
  studentName: string;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function StudentWalletClient({ studentName }: StudentWalletClientProps) {
  const router = useRouter();
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<WalletEntry[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [settings, walletRows] = await Promise.all([fetchSystemSettings(), fetchWalletEntries()]);
        if (!isMounted) return;

        setWalletEnabled(Boolean(settings?.wallet_enabled));
        setEntries(walletRows);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    const unsubscribeSettings = subscribeToSystemSettings((settings) => {
      if (isMounted) {
        setWalletEnabled(Boolean(settings.wallet_enabled));
      }
    });

    const unsubscribeWallets = subscribeToWalletEntries((rows) => {
      if (isMounted) {
        setEntries(rows);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeWallets) unsubscribeWallets();
    };
  }, []);

  const balance = entries.reduce((total, entry) => total + entry.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo bg-slate-50 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] text-[#0A2540]">المحفظة</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
                {isLoading
                  ? "جارٍ تحميل بيانات المحفظة..."
                  : walletEnabled
                    ? `المحفظة مفعلة للطالب ${studentName}`
                    : "المحفظة غير مفعلة من إعدادات النظام حالياً"}
              </p>
            </div>
          </div>
        </header>

        {!walletEnabled ? (
          <EmptyState
            icon={CircleDashed}
            title="المحفظة متوقفة حالياً"
            description="إعداد wallet_enabled داخل system_settings هو اللي بيحدد ظهورها للمستخدم."
            actionLabel="العودة إلى لوحة الطالب"
            onAction={() => router.push("/student/dashboard")}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 text-slate-500">الرصيد الحالي</p>
                  <h2 className="mt-1 text-3xl font-black text-[#0A2540] text-[#0A2540]">{formatAmount(balance)}</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
                  <CreditCard className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {entries.length === 0 ? (
                  <EmptyState
                    icon={CircleDashed}
                    title="لا توجد عمليات بعد"
                    description="أي شحن أو خصم أو حركة مالية هتظهر هنا بمجرد إضافتها في قاعدة البيانات."
                  />
                ) : (
                  entries.map((entry) => (
                    <article
                      key={entry.id ?? `${entry.created_at ?? "entry"}-${entry.amount}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-extrabold text-[#0A2540] text-[#0A2540]">{entry.owner}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-500 text-slate-500">
                            {entry.reason || entry.account_type}
                          </p>
                        </div>
                        <div className={`text-lg font-black ${entry.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {entry.amount >= 0 ? "+" : ""}
                          {formatAmount(entry.amount)}
                        </div>
                      </div>
                      {entry.created_at ? (
                        <p className="mt-3 text-xs font-bold text-slate-400">{new Date(entry.created_at).toLocaleString("ar-EG")}</p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-slate-200 bg-white">
              <h3 className="text-lg font-extrabold text-[#0A2540] text-[#0A2540]">حالة المحفظة</h3>
              <p className="text-sm font-bold leading-6 text-slate-500 text-slate-500">
                البيانات هنا جاية مباشرة من Supabase مع تفعيل الحماية على مستوى الصفوف.
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 text-slate-500">عدد العمليات</p>
                <p className="mt-1 text-2xl font-black text-[#0A2540] text-[#0A2540]">{entries.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 text-slate-500">الطالب</p>
                <p className="mt-1 text-lg font-extrabold text-[#0A2540] text-[#0A2540]">{studentName}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
