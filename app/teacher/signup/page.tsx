"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";

export default function TeacherSignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (!name.trim() || !phone.trim() || password.length < 8) {
        throw new Error("من فضلك اكتب الاسم ورقم الهاتف وكلمة مرور مكونة من 8 أحرف على الأقل.");
      }
      if (!normalizeEgyptianPhone(phone)) {
        throw new Error("الرجاء إدخال رقم هاتف مصري صحيح.");
      }

      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), password, role: "teacher" }),
      });
      const result = (await response.json()) as { error?: string; requiresPhoneVerification?: boolean };
      if (!response.ok) throw new Error(result.error ?? "تعذر إنشاء الحساب");
      if (result.requiresPhoneVerification) {
        setMsg("تم إرسال رمز تأكيد للهاتف. أكد الرقم ثم سجّل الدخول.");
        return;
      }
      router.push("/teacher/dashboard");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "تعذر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">إنشاء حساب معلم</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-bold">
          الاسم
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block text-sm font-bold">
          رقم الهاتف
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block text-sm font-bold">
          كلمة المرور
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">
          {loading ? "جارٍ الحفظ..." : "إنشاء الحساب"}
        </button>
        {msg ? <div className="mt-2 text-sm text-slate-600">{msg}</div> : null}
      </form>
    </div>
  );
}
