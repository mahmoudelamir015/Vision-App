"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createProfile } from "@/lib/supabase/profiles";

export default function TeacherVerifyPage() {
  const search = useSearchParams();
  const phone = search.get("phone") ?? "";
  const router = useRouter();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    const savedName = localStorage.getItem(`dev_name_${phone}`) ?? "";
    setName(savedName);
  }, [phone]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const expected = localStorage.getItem(`dev_otp_${phone}`);
      if (!expected || expected !== code) {
        setMsg("كود التحقق غير صحيح");
        return;
      }

      const created = await createProfile({ phone, name, role: "teacher" });
      if (!created) {
        setMsg("فشل حفظ البروفايل");
        return;
      }
      // mark dev session and redirect to teacher dashboard
      localStorage.setItem("dev_logged_in_phone", phone);
      localStorage.setItem("dev_user_role", "teacher");
      localStorage.removeItem(`dev_otp_${phone}`);
      localStorage.removeItem(`dev_name_${phone}`);
      router.push("/teacher/dashboard");
    } catch (err) {
      setMsg((err as Error).message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">تحقق تسجيل المدرس/ة</h1>
      <form className="mt-4 space-y-3" onSubmit={verify}>
        <div>
          <label className="text-sm font-bold">رقم الموبايل</label>
          <input disabled value={phone} className="w-full rounded-md border px-3 py-2 bg-slate-50" />
        </div>
        <div>
          <label className="text-sm font-bold">الاسم</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-bold">كود التحقق</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <button disabled={loading} className="rounded-md bg-[#0A2540] px-4 py-2 text-white">{loading ? "جاري..." : "تحقق وسجل"}</button>
        </div>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </div>
  );
}
