"use client";

import { useState } from "react";
import { Clock, Key } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentScanPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 4) {
      setMessage({ type: "error", text: "يرجى إدخال الكود المكون من 4 أرقام كاملاً" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/student/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pin.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "كود الحصة المدخل غير صالح أو انتهت صلاحيته");
      }

      setMessage({ type: "success", text: "تم تسجيل حضورك للجلسة بنجاح! شكراً لك." });
      setPin("");
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "تعذر تسجيل الحضور، يرجى المحاولة لاحقاً",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 flex flex-col justify-center min-h-[80vh]">
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-md text-right">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540] text-[#D4AF37]">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540]">تسجيل الحضور</h1>
            <p className="mt-1 text-xs font-bold text-slate-400">سيلف-أرتندنس بكود الحصة</p>
          </div>
        </div>

        <p className="mb-6 text-sm font-bold text-slate-500 leading-6">
          أدخل الكود المكون من 4 أرقام الذي يظهر على الشاشة في السنتر لتسجيل حضورك تلقائياً في قاعدة البيانات.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="مثال: 4821"
            className="w-full text-center text-4xl font-mono tracking-widest rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:border-[#D4AF37] focus:bg-white text-[#0A2540] focus:ring-1 focus:ring-[#D4AF37]"
          />

          <button
            type="submit"
            disabled={isSubmitting || pin.trim().length !== 4}
            className="w-full rounded-2xl bg-[#0A2540] px-4 py-4 text-sm font-bold text-white transition-opacity disabled:opacity-50 hover:bg-[#123B66]"
          >
            {isSubmitting ? "جاري التحقق..." : "تسجيل الحضور"}
          </button>
        </form>

        {message ? (
          <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {message.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}
