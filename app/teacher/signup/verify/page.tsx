import Link from "next/link";

export default function TeacherVerifyPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">تأكيد حساب المعلم</h1>
      <p className="mt-3 text-sm text-slate-600">
        بعد مراجعة رقم الهاتف وكلمة المرور من الأدمن، هيتم تفعيل الحساب وتقدر تدخل من تسجيل الدخول مباشرة.
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-[#0A2540] px-4 py-2 text-white">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
