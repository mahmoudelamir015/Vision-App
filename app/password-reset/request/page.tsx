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
      // Dev flow: generate OTP and store locally (no SMS)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`dev_reset_otp_${phone}`, code);
      console.log("DEV RESET OTP for", phone, "=", code);
      setMsg("رمز استرجاع الباسورد اتبعت (شوف Console للرمز في التطوير)");
      router.push(`/password-reset/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setMsg((err as Error).message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">استرجاع كلمة المرور</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="text-sm font-bold">رقم الموبايل</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">{loading ? "جاري..." : "أرسل كود"}</button>
        </div>
        {msg ? <div className="text-sm text-green-600">{msg}</div> : null}
      </form>
    </div>
  );
}
