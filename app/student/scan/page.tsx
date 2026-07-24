"use client";

import { useState } from "react";
import { Save, QrCode } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeEgyptianPhone } from "@/lib/auth/phone";
import { saveAttendanceRecord } from "@/lib/supabase/attendance";

export default function StudentScanPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submitPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);

    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!normalizedPhone) {
      setMessage("اكتب رقم موبايل صحيح");
      return;
    }

    if (!qrValue.trim()) {
      setMessage("اكتب نص الـ QR");
      return;
    }

    if (pin.trim().length < 4) {
      setMessage("اكتب الـ PIN المختصر");
      return;
    }

    try {
      const saved = await saveAttendanceRecord({
        student_name: name.trim() || normalizedPhone,
        student_phone: normalizedPhone,
        code: pin.trim(),
        qr_value: qrValue.trim(),
        created_at: new Date().toISOString(),
      });

      if (saved) {
        setMessage("تم تسجيل الحضور. شكراً!");
        setPin("");
        setQrValue("");
      } else {
        setMessage("فشل التسجيل، حاول مرة تانية.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === "INSUFFICIENT_BALANCE") {
        setMessage("عفواً، الرصيد غير كافٍ. يرجى مراجعة السكرتارية.");
      } else {
        setMessage(msg || "فشل التسجيل، حاول مرة تانية.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-extrabold text-[#0A2540]">تسجيل الحضور الذكي</h1>
      <p className="mt-2 text-sm text-slate-600">اكتب رقم الهاتف، الصق نص الـ QR، ثم اكتب الـ PIN القصير لتأكيد الحضور.</p>

      <form onSubmit={submitPin} className="mt-6 grid gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الموبايل" dir="ltr" className="rounded-xl border px-4 py-3" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (اختياري)" className="rounded-xl border px-4 py-3" />
        <textarea
          value={qrValue}
          onChange={(e) => setQrValue(e.target.value)}
          rows={3}
          placeholder="نص الـ QR"
          className="rounded-xl border px-4 py-3 font-mono text-sm"
          dir="ltr"
        />
        <div className="flex gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="الـ PIN"
            className="flex-1 rounded-xl border px-4 py-3 font-mono text-center text-2xl"
          />
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-white">
            <Save className="h-4 w-4" /> تسجيل
          </button>
        </div>
      </form>

      {message ? <div className="mt-4 rounded-xl border p-3">{message}</div> : null}

      <div className="mt-6">
        <EmptyState icon={QrCode} title="مساعدات QR" description="لو الكاميرا مش متاحة، الصق نص الـ QR هنا مع الـ PIN لتسجيل الحضور يدويًا." />
      </div>
    </div>
  );
}
