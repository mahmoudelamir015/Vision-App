"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Phone, ShieldCheck, CheckCircle2, ShieldAlert } from "lucide-react";

export default function PasswordResetVerifyForm() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    if (!phone) {
      setMsg({ type: "error", text: "رقم الهاتف مطلوب" });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMsg({ type: "error", text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const result = (await response.json()) as { error?: string; role?: string; ok?: boolean };
      if (!response.ok) throw new Error(result.error ?? "تعذر تغيير كلمة المرور");
      setMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح! جاري تحويلك إلى لوحة التحكم..." });
      const destination = result.role === "teacher" ? "/teacher/dashboard" : result.role === "parent" ? "/parent/dashboard" : "/student/dashboard";
      window.setTimeout(() => router.push(destination), 1000);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "تعذر تغيير كلمة المرور" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#07192C] via-[#0A2540] to-[#041224] p-4 font-cairo text-white">
      {/* Glow Orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-10">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#FFF099] text-[#0A2540] shadow-lg shadow-[#D4AF37]/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">تعيين كلمة المرور الجديدة</h1>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-300 sm:text-sm">
              أدخل كلمة المرور الجديدة لحسابك واحتفظ بها في مكان آمن.
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200 sm:text-sm">رقم الهاتف الحساب</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <Phone className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <input
                  disabled
                  value={phone?.replace(/^\+?20/, "0")}
                  className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-black/40 py-3.5 pr-12 pl-4 text-sm font-bold text-slate-300 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200 sm:text-sm">كلمة المرور الجديدة</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <Lock className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 py-3.5 pr-12 pl-4 text-sm font-bold text-white placeholder-slate-400 outline-none transition-all duration-300 focus:border-[#D4AF37] focus:bg-black/30 focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {msg && (
              <div
                className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-bold ${
                  msg.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                    : "border-red-500/30 bg-red-500/15 text-red-200"
                }`}
              >
                {msg.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E2C366] py-4 text-sm font-extrabold text-[#0A2540] shadow-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور والتحويل"}</span>
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs font-bold text-slate-300 transition hover:text-[#D4AF37] hover:underline"
            >
              إلغاء والعودة لصفحة الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
