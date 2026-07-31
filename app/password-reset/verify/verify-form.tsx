"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PasswordResetVerifyForm() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر تغيير كلمة المرور");
      const me = await fetch("/api/auth/me");
      const profile = (await me.json()) as { profile?: { role?: string } };
      const destination = profile.profile?.role === "teacher" ? "/teacher/dashboard" : profile.profile?.role === "parent" ? "/parent/dashboard" : "/student/dashboard";
      router.push(destination);
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
          رمز التحقق
          <input
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
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
          {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
