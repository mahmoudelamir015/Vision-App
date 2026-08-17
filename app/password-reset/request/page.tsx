"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Phone, ArrowRight, Sparkles, ShieldAlert } from "lucide-react";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";

export default function PasswordResetRequest() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    const normalizedPhone = normalizeEgyptianPhone(phone.trim());
    if (!normalizedPhone) {
      setMsg("رقم الهاتف غير صالح. يرجى إدخال رقم هاتف مصري صحيح (مثال: 011XXXXXXX)");
      setLoading(false);
      return;
    }

    router.push(`/password-reset/verify?phone=${encodeURIComponent(normalizedPhone)}`);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#07192C] via-[#0A2540] to-[#041224] p-4 font-cairo text-white">
      {/* Glow decorative Orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-10">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#FFF099] text-[#0A2540] shadow-lg shadow-[#D4AF37]/20">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-white sm:text-3xl">استعادة كلمة المرور</h1>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-300 sm:text-sm">
              أدخل رقم الهاتف المسجل بالحساب وسيتم إتاحة تعيين كلمة مرور جديدة فوراً.
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200 sm:text-sm">رقم الهاتف المسجل</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <Phone className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="011XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 py-3.5 pr-12 pl-4 text-sm font-bold text-white placeholder-slate-400 outline-none transition-all duration-300 focus:border-[#D4AF37] focus:bg-black/30 focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {msg && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs font-bold text-red-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E2C366] py-4 text-sm font-extrabold text-[#0A2540] shadow-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5" />
              <span>{loading ? "جارٍ التحقق..." : "متابعة"}</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-xs font-bold text-slate-300 transition hover:text-[#D4AF37] hover:underline"
            >
              العودة لشاشة التسجيل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
