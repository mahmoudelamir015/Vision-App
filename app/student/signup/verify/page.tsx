import Link from "next/link";

export default function StudentVerifyPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">تأكيد حساب الطالب</h1>
      <p className="mt-3 text-sm text-slate-600">
        تم إرسال بيانات التسجيل للمراجعة. بعد موافقة الأدمن وتأكيد الحساب تقدر تدخل من تسجيل الدخول وتكمل استخدام المنصة.
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-[#0A2540] px-4 py-2 text-white">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
