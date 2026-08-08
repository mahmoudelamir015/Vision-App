"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PasswordResetVerifyForm() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    if (!phone) {
      setMsg("رقم الهاتف مطلوب");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMsg("كلمة المرور لازم تكون 8 أحرف على الأقل");
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
      setMsg("تم تغيير كلمة المرور بنجاح. جاري تحويلك للوحة الحساب...");
      const destination = result.role === "teacher" ? "/teacher/dashboard" : result.role === "parent" ? "/parent/dashboard" : "/student/dashboard";
      window.setTimeout(() => router.push(destination), 800);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">تأكيد تغيير كلمة المرور</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-bold">
          رقم الهاتف
          <input disabled value={phone} className="mt-1 w-full rounded-md border bg-slate-50 px-3 py-2" />
        </label>
        <label className="block text-sm font-bold">
          كلمة المرور الجديدة
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">
          {loading ? "جارٍ الحفظ..." : "تعيين كلمة المرور"}
        </button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
