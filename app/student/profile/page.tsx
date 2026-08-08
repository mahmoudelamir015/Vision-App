"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDashed, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";

type ProfileState = {
  name: string;
  phone: string;
  stage: string;
  grade: string;
  track: string;
  school_name: string;
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState<ProfileState>({
    name: "",
    phone: "",
    stage: "",
    grade: "",
    track: "",
    school_name: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as { profile?: Record<string, unknown>; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error ?? "تعذر تحميل الملف الشخصي");

        const profile = payload?.profile ?? {};
        setForm({
          name: typeof profile.name === "string" ? profile.name : "",
          phone: typeof profile.phone === "string" ? profile.phone : "",
          stage: typeof profile.stage === "string" ? profile.stage : "",
          grade: typeof profile.grade === "string" ? profile.grade : "",
          track: typeof profile.track === "string" ? profile.track : "",
          school_name: typeof profile.school_name === "string" ? profile.school_name : "",
        });
      } catch (error) {
        setFeedback({ type: "error", message: error instanceof Error ? error.message : "تعذر تحميل الملف الشخصي" });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const normalizedPhone = normalizeEgyptianPhone(form.phone);
      if (!normalizedPhone) {
        throw new Error("رقم الهاتف غير صالح");
      }

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: normalizedPhone,
          stage: form.stage || null,
          grade: form.grade || null,
          track: form.track || null,
          school_name: form.school_name.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { profile?: Record<string, unknown>; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "تعذر حفظ الملف الشخصي");
      setFeedback({ type: "success", message: "تم حفظ بياناتك بنجاح." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "تعذر حفظ الملف الشخصي" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const password = window.prompt("اكتب كلمة المرور الجديدة (8 أحرف على الأقل):");
    if (!password || password.trim().length < 8) return;

    setPasswordLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "تعذر تغيير كلمة المرور");
      setFeedback({ type: "success", message: "تم تغيير كلمة المرور بنجاح." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "تعذر تغيير كلمة المرور" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-cairo dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2540] text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">الملف الشخصي</h1>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                بياناتك تظهر هنا مباشرة من قاعدة البيانات ويمكنك تحديثها أو تغيير كلمة المرور في أي وقت.
              </p>
            </div>
          </div>
        </header>

        {feedback ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {feedback.message}
          </div>
        ) : null}

        <form onSubmit={handleSave} className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <CircleDashed className="h-5 w-5 animate-spin" />
              جارٍ تحميل بياناتك...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                الاسم
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                رقم الهاتف
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" dir="ltr" />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                المرحلة
                <input value={form.stage} onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                الصف
                <input value={form.grade} onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                القسم
                <input value={form.track} onChange={(event) => setForm((current) => ({ ...current, track: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                اسم المدرسة
                <input value={form.school_name} onChange={(event) => setForm((current) => ({ ...current, school_name: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving || loading} className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">
              <Save className="h-4 w-4" />
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
            <button type="button" onClick={handleChangePassword} disabled={passwordLoading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
              <ShieldCheck className="h-4 w-4" />
              {passwordLoading ? "جارٍ تغيير الباسورد..." : "تغيير كلمة المرور"}
            </button>
            <button type="button" onClick={() => router.push("/student/dashboard")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
              العودة للوحة الطالب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
