"use client";

import { useEffect, useState } from "react";
import { FileEdit, CheckCircle2, XCircle, RefreshCw, User, Calendar } from "lucide-react";

type ChangeRequest = {
  id: string;
  user_id: string;
  user_type: string;
  requested_field: string;
  new_value: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  users?: {
    name?: string;
    phone?: string;
    student_code?: string;
  };
};

const fieldLabels: Record<string, string> = {
  name: "الاسم بالكامل",
  phone: "رقم الهاتف",
  stage: "المرحلة الدراسية",
  grade: "الصف الدراسي",
  track: "الشعبة",
};

export default function AdminChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/change-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل جلب طلبات التعديل");
      setRequests(data.requests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ أثناء التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/change-requests");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل جلب طلبات التعديل");
        if (active) setRequests(data.requests || []);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "خطأ أثناء التحميل");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل معالجة الطلب");

      setRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action } : item))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-cairo">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
              <FileEdit className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0A2540]">إدارة طلبات التعديل</h1>
              <p className="text-sm font-bold text-slate-500">مراجعة واعتمد/رَفْض طلبات الطلاب لتعديل بيانات حساباتهم</p>
            </div>
          </div>
          <button
            onClick={() => void fetchRequests()}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {/* List of Requests */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="py-12 text-center font-bold text-slate-500">جارٍ تحميل الطلبات من قاعدة البيانات...</p>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center font-bold text-slate-500">لا توجد طلبات تعديل مقدمة حتى الآن.</div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-extrabold text-[#0A2540]">
                        <User className="h-4 w-4 text-[#D4AF37]" />
                        {req.users?.name || "طالب"}
                      </span>
                      {req.users?.phone && (
                        <span className="text-xs font-bold text-slate-400">
                          ({req.users.phone.replace(/^\+?20/, "0")})
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      طلب تعديل <span className="font-extrabold text-[#0A2540]">{fieldLabels[req.requested_field] || req.requested_field}</span> إلى:{" "}
                      <span className="rounded-lg bg-emerald-100 px-2 py-0.5 font-black text-emerald-800">{req.new_value}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-500">السبب: {req.reason}</p>
                    <p className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(req.created_at).toLocaleString("ar-EG")}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    {req.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "approved")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          موافقة وتحديث
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "rejected")}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          رفض
                        </button>
                      </>
                    ) : req.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> تمت الموافقة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">
                        <XCircle className="h-4 w-4" /> تم الرفض
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
