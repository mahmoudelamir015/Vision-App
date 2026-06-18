"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, QrCode } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchUsers } from "@/lib/supabase/users";
import { saveAttendanceRecord } from "@/lib/supabase/attendance";

export default function StudentScanPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("appUserPhone") ?? "" : ""));
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    (async () => {
      try {
        const users = await fetchUsers();
        const found = users.find((u) => u.phone === phone);
        if (found) setName(found.name);
      } catch {}
    })();
  }, [phone]);

  const submitPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin || pin.trim().length < 3) {
      setMessage("اكتب الكود المكون من 3 أرقام");
      return;
    }
    try {
      const saved = await saveAttendanceRecord({
        student_name: name || phone,
        student_phone: phone || undefined,
        code: pin.trim(),
        created_at: new Date().toISOString(),
      });

      if (saved) {
        setMessage("تم تسجيل الحضور. شكراً!");
        setPin("");
      } else {
        setMessage("فشل التسجيل، حاول مرة أخرى.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "INSUFFICIENT_BALANCE") {
        setMessage("عفواً، الرصيد غير كافٍ. يرجى مراجعة السكرتارية.");
      } else {
        setMessage("فشل التسجيل، حاول مرة أخرى.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-extrabold text-[#0A2540]">تسجيل الحضور الذكي</h1>
      <p className="mt-2 text-sm text-slate-600">اكتب الرقم المختصر (3 أرقام) أو الصق قيمة QR لتسجيل الحضور.</p>

      <form onSubmit={submitPin} className="mt-6 grid gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الموبايل" dir="ltr" className="rounded-xl border px-4 py-3" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (اختياري)" className="rounded-xl border px-4 py-3" />
        <div className="flex gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
            placeholder="الكود (3 أرقام)"
            className="flex-1 rounded-xl border px-4 py-3 font-mono text-center text-2xl"
          />
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-white">
            <Save className="h-4 w-4" /> تسجيل
          </button>
        </div>
      </form>

      {message ? <div className="mt-4 rounded-xl border p-3">{message}</div> : null}

      <div className="mt-6">
        <EmptyState icon={QrCode} title="مساحات مساندة" description="لو عايز تضيف مسح QR كاميرا، هقدر أضيف المكتبة وندمجها قريباً." />
      </div>
    </div>
  );
}
