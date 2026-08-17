"use client";

import { useEffect, useState } from "react";
import { Vault, ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle } from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  type: "credit" | "debit";
  reason: string;
  created_at: string;
};

type Settlement = {
  id: string;
  total_amount: number;
  settled_at: string;
};

export default function VaultPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchVaultData = async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vault");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل جلب بيانات الخزنة");
      setBalance(data.vaultBalance || 0);
      setTransactions(data.transactions || []);
      setSettlements(data.settlements || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/vault");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل جلب بيانات الخزنة");
        if (active) {
          setBalance(data.vaultBalance || 0);
          setTransactions(data.transactions || []);
          setSettlements(data.settlements || []);
        }
      } catch (err: unknown) {
        if (active) {
          const message = err instanceof Error ? err.message : "خطأ غير معروف";
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), type, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إضافة المعاملة");

      setShowModal(false);
      setAmount("");
      setReason("");
      await fetchVaultData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ في الإضافة";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-cairo">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
              <Vault className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0A2540]">إدارة الخزنة المالية الرئيسية</h1>
              <p className="text-sm font-bold text-slate-500">مربوطة مباشرة بالداتابيز والمعاملات الحقيقية</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void fetchVaultData()}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#0A2540] px-5 py-2.5 font-bold text-white transition hover:bg-[#0A2540]/90"
            >
              <PlusCircle className="h-5 w-5" />
              حركة خزنة جديدة
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-slate-500">إجمالي رصيد الخزنة</span>
            <div className="mt-2 text-3xl font-black text-[#0A2540]">
              {balance.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-slate-500">عدد المعاملات المسجلة</span>
            <div className="mt-2 text-3xl font-black text-[#0A2540]">{transactions.length}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-slate-500">التسويات المكتملة</span>
            <div className="mt-2 text-3xl font-black text-[#0A2540]">{settlements.length}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-[#0A2540]">سجل الخزنة والمعاملات</h2>
          {loading ? (
            <p className="py-8 text-center font-bold text-slate-500">جارٍ التحميل من قاعدة البيانات...</p>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center font-bold text-slate-500">لا توجد معاملات مضافة حتى الآن في الخزنة.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-black text-slate-500">
                    <th className="pb-3">النوع</th>
                    <th className="pb-3">السبب / البيان</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-bold">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        {t.type === "credit" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <ArrowDownLeft className="h-4 w-4" /> إيداع
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <ArrowUpRight className="h-4 w-4" /> سحب / صرف
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-slate-800">{t.reason}</td>
                      <td className={`py-4 font-black ${t.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                        {t.amount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="py-4 text-slate-400">{new Date(t.created_at).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-xl font-black text-[#0A2540]">إضافة حركة خزنة جديدة</h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع الحركة</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "credit" | "debit")}
                    className="w-full rounded-2xl border border-slate-200 p-3 font-bold"
                  >
                    <option value="credit">إيداع (وارد للنزنة)</option>
                    <option value="debit">سحب / مصروفات (منفذ من الخزنة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (ج.م)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مثال: 500"
                    required
                    className="w-full rounded-2xl border border-slate-200 p-3 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">السبب / التفاصيل</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: توريد حصة اليوم"
                    required
                    className="w-full rounded-2xl border border-slate-200 p-3 font-bold"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-2xl bg-[#0A2540] py-3 font-bold text-white transition hover:bg-[#0A2540]/90 disabled:opacity-50"
                  >
                    {submitting ? "جارٍ الحفظ..." : "حفظ في الداتابيز"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-100"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
