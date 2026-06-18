"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyOtpAndSetPassword } from "@/lib/supabase/auth";

export default function PasswordResetVerify() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const router = useRouter();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    const saved = localStorage.getItem(`dev_reset_otp_${phone}`) ?? "";
    if (saved) console.log("Found dev reset otp for", phone);
  }, [phone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const expected = localStorage.getItem(`dev_reset_otp_${phone}`);
      if (!expected || expected !== code) {
        setMsg("كود خاطئ");
        return;
      }

      // Try to set password via Supabase helper (will verify OTP and set password)
      await verifyOtpAndSetPassword(phone, code, password);
      localStorage.removeItem(`dev_reset_otp_${phone}`);
      localStorage.setItem("dev_logged_in_phone", phone);
      localStorage.setItem("dev_user_role", "student");
      router.push("/student/profile");
    } catch (err) {
      setMsg((err as Error).message || "فشل تعديل الباسورد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">تحقق واسترجاع كلمة المرور</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="text-sm font-bold">رقم الموبايل</label>
          <input disabled value={phone} className="w-full rounded-md border px-3 py-2 bg-slate-50" />
        </div>
        <div>
          <label className="text-sm font-bold">كود التحقق</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-bold">كلمة المرور الجديدة</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">{loading ? "جاري..." : "تحديث كلمة المرور"}</button>
        </div>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
