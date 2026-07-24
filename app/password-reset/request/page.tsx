"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordResetRequest() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر إرسال رمز التحقق");
      router.push(`/password-reset/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر إرسال رمز التحقق");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
      <p className="mt-2 text-sm text-slate-600">هنبعت رمز تحقق للهاتف المسجل بالحساب.</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-bold">
          رقم الهاتف
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">
          {loading ? "جارٍ الإرسال..." : "إرسال الرمز"}
        </button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
