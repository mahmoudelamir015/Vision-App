"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherSignupPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`dev_otp_${phone}`, code);
      console.log("DEV OTP for", phone, "=", code);
      localStorage.setItem(`dev_name_${phone}`, name);
      setMsg("رمز التحقق تم إنشاؤه (اطلع على Console للرمز في بيئة التطوير).");
      const router = useRouter();
      router.push(`/teacher/signup/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setMsg((err as Error).message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">تسجيل مدرس/ة</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="text-sm font-bold">الاسم</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-bold">رقم الموبايل</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">
            {loading ? "جاري..." : "أرسل رمز التحقق"}
          </button>
        </div>

        {msg ? <div className="mt-2 text-sm text-slate-600">{msg}</div> : null}
      </form>
    </div>
  );
}
