"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
      setMsg("رقم الهاتف غير صالح. استخدم صيغة 01XXXXXXXXX أو +201XXXXXXXXX");
      setLoading(false);
      return;
    }

    router.push(`/password-reset/verify?phone=${encodeURIComponent(normalizedPhone)}`);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
      <p className="mt-2 text-sm text-slate-600">أدخل رقم الهاتف المسجل بالحساب وسيُسمح لك بتعيين كلمة مرور جديدة مباشرة.</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-bold">
          رقم الهاتف
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">
          {loading ? "جارٍ المتابعة..." : "متابعة"}
        </button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
