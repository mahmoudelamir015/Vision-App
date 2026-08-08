"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, QrCode } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Html5Qrcode } from "html5-qrcode";

export default function StudentScanPage() {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitToken = async (token: string) => {
    if (!token.trim()) {
      setMessage("لم يتم قراءة الباركود بعد");
      return;
    }

    setIsSubmitting(true);
    setMessage("جارٍ تسجيل الحضور...");

    try {
      const response = await fetch("/api/student/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; success?: boolean } | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "تعذر تسجيل الحضور");
      }

      setMessage("تم تسجيل الحضور بنجاح. شكراً!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تسجيل الحضور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch {
        // ignore stop failures
      }
      try {
        await scannerInstanceRef.current.clear();
      } catch {
        // ignore clear failures
      }
      scannerInstanceRef.current = null;
      setIsScanning(false);
      setIsCameraReady(false);
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("الكاميرا غير متاحة على هذا الجهاز");
      return;
    }

    setMessage("جارٍ تهيئة الكاميرا...");
    setIsScanning(true);

    try {
      const cameras = await Html5Qrcode.getCameras();
      const selectedCamera = cameras?.find((camera) => /back|rear|environment/i.test(camera.label))?.id ?? cameras?.[0]?.id;
      if (!selectedCamera) {
        throw new Error("لم يتم العثور على كاميرا متاحة");
      }

      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      scannerInstanceRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          disableFlip: false,
        },
        async (decodedText) => {
          await stopScanner();
          await submitToken(decodedText);
        },
        (errorMessage) => {
          console.debug("QR scan error", errorMessage);
        },
      );

      setIsCameraReady(true);
      setMessage("امسح الباركود الموجود في السنتر الآن");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر فتح الكاميرا");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    void startScanner();

    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-extrabold text-[#0A2540]">تسجيل الحضور الذكي</h1>
      <p className="mt-2 text-sm text-slate-600">افتح الكاميرا وامسح الباركود المعروض في السنتر لتسجيل الحضور فوراً.</p>

      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
          <div id="html5qr-scanner" ref={scannerRef} className="h-72 w-full bg-black" />
          {!isCameraReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-500">جارٍ فتح الكاميرا...</p>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void startScanner()}
          disabled={isSubmitting || isScanning}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-white"
        >
          <ScanLine className="h-4 w-4" />
          {isSubmitting ? "جارٍ تسجيل الحضور..." : isScanning ? "جارٍ المسح..." : "بدء المسح"}
        </button>

        {message ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      </div>

      <div className="mt-6">
        <EmptyState icon={QrCode} title="إشعار سريع" description="لو لم تعمل الكاميرا، يرجى إعادة تحميل الصفحة أو استخدام زر بدء المسح مرة أخرى." />
      </div>
    </div>
  );
}
