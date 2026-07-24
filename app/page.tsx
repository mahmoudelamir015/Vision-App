"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Phone,
  User,
  Users,
} from "lucide-react";
import { fetchSystemSettings, subscribeToSystemSettings } from "@/lib/supabase/system-settings";

type Role = "student" | "parent" | "teacher";
type ViewState = "login" | "signup" | "forgot_password";
type StudentStage = "" | "primary" | "prep" | "secondary";
type SecondaryTrack = "" | "arts" | "science" | "math";
type TeacherStage = "" | "primary" | "prep" | "secondary";

async function authRequest<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "حدث خطأ أثناء المصادقة");
  return result;
}

const roleTabs: Array<{ id: Role; label: string; icon: typeof User }> = [
  { id: "student", label: "الطالب", icon: User },
  { id: "parent", label: "ولي أمر", icon: Users },
  { id: "teacher", label: "المعلم", icon: GraduationCap },
];

const stageGrades: Record<Exclude<StudentStage, "">, string[]> = {
  primary: ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"],
  prep: ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"],
  secondary: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
};

const secondaryTracks: Array<{ value: SecondaryTrack; label: string }> = [
  { value: "arts", label: "أدبي" },
  { value: "science", label: "علمي علوم" },
  { value: "math", label: "علمي رياضة" },
];

const teacherStages: Array<{ value: TeacherStage; label: string }> = [
  { value: "primary", label: "ط§ط¨طھط¯ط§ط¦ظٹ" },
  { value: "prep", label: "ط¥ط¹ط¯ط§ط¯ظٹ" },
  { value: "secondary", label: "ثانوي" },
];

function Field({
  label,
  name,
  type = "text",
  placeholder,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-[#0A2540]">
      <span>{label}</span>
      <div className="mt-1">
        {children ?? <input name={name} type={type} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10" />}
      </div>
    </label>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("login");
  const [role, setRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [studentStage, setStudentStage] = useState<StudentStage>("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentTrack, setStudentTrack] = useState<SecondaryTrack>("");
  const [teacherStage, setTeacherStage] = useState<TeacherStage>("");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      const settings = await fetchSystemSettings();
      if (!mounted) return;
      setRegistrationOpen(Boolean(settings?.registration_open ?? true));
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (mounted) {
        setRegistrationOpen(Boolean(settings.registration_open));
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    try {
      const formData = new FormData(event.currentTarget);

      if (view === "login") {
        const identifier = String(formData.get("auth_identifier") ?? "").trim();
        const password = String(formData.get("auth_password") ?? "").trim();
        const result = await authRequest<{ profile: { role: Role } }>("/api/auth/sign-in", { phone: identifier, password });
        if (result.profile.role === "student") router.push("/student/dashboard");
        if (result.profile.role === "parent") router.push("/parent/dashboard");
        if (result.profile.role === "teacher") router.push("/teacher/dashboard");
        return;
      }

      if (view === "forgot_password") {
        setNotice("استخدم صفحة استعادة كلمة المرور لإرسال رمز التحقق لهاتفك.");
        setView("login");
        return;
      }

      if (!registrationOpen) {
        throw new Error("التسجيل مغلق حالياً من الإدارة");
      }

      if (role === "student") {
        const result = await authRequest<{ requiresPhoneVerification: boolean }>("/api/auth/sign-up", {
          name: String(formData.get("student_name") ?? "").trim(),
          phone: String(formData.get("student_phone") ?? "").trim(),
          role: "student",
          password: String(formData.get("student_password") ?? "").trim(),
          stage: studentStage,
          grade: studentGrade,
          track: studentTrack,
          parent_phone: String(formData.get("parent_phone") ?? "").trim() || undefined,
        });
        if (result.requiresPhoneVerification) {
          setNotice("تم إرسال رمز تأكيد للهاتف. أكد الرقم ثم سجّل الدخول.");
          setView("login");
        } else router.push("/student/profile");
        return;
      }

      if (role === "parent") {
        const result = await authRequest<{ requiresPhoneVerification: boolean }>("/api/auth/sign-up", {
          name: String(formData.get("parent_name") ?? "").trim(),
          phone: String(formData.get("parent_phone") ?? "").trim(),
          role: "parent",
          password: String(formData.get("parent_password") ?? "").trim(),
          student_code: String(formData.get("parent_link_code") ?? "").trim() || undefined,
          child_name: String(formData.get("parent_child_name") ?? "").trim(),
        });
        if (result.requiresPhoneVerification) {
          setNotice("تم إرسال رمز تأكيد للهاتف. أكد الرقم ثم سجّل الدخول.");
          setView("login");
        } else router.push("/parent/dashboard");
        return;
      }

      const result = await authRequest<{ requiresPhoneVerification: boolean }>("/api/auth/sign-up", {
        name: String(formData.get("teacher_name") ?? "").trim(),
        phone: String(formData.get("teacher_phone") ?? "").trim(),
        role: "teacher",
        password: String(formData.get("teacher_password") ?? "").trim(),
        stage: teacherStage,
        school_name: String(formData.get("teacher_school") ?? "").trim() || undefined,
        subjects: String(formData.get("teacher_subjects") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        photo_name: String(formData.get("teacher_photo") ?? "").trim() || undefined,
      });
      if (result.requiresPhoneVerification) {
        setNotice("تم إرسال رمز تأكيد للهاتف. أكد الرقم ثم سجّل الدخول.");
        setView("login");
      } else router.push("/teacher/dashboard");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "حدث خطأ أثناء تنفيذ العملية");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4EA] via-white to-[#EEF4FF] p-4 text-[#0A2540] sm:p-8" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(10,37,64,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#123B66] to-[#1E5B97] p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.25),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_38%)]" />
            <div className="relative z-10 max-w-sm text-center">
              <Image src="/logo.png" alt="Vision Center" width={140} height={140} className="mx-auto mb-6 h-28 w-28 object-contain" priority />
              <h1 className="text-3xl font-extrabold leading-tight">منصة رؤية التعليمية</h1>
              <p className="mt-3 text-sm font-semibold text-white/80">
                دخول سريع وآمن للطلاب وأولياء الأمور والمعلمين مع واجهة عربية واضحة وخفيفة.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8A6A00]">Vision</p>
                <h2 className="mt-1 text-2xl font-extrabold">{view === "login" ? "تسجيل الدخول" : view === "signup" ? "إنشاء حساب جديد" : "استعادة كلمة المرور"}</h2>
              </div>
            </div>

            <div className="mb-6 flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              {roleTabs.map((item) => {
                const Icon = item.icon;
                const active = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRole(item.id);
                      setFormError(null);
                      setShowPassword(false);
                      setStudentStage("");
                      setStudentGrade("");
                      setStudentTrack("");
                      setTeacherStage("");
                    }}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      active ? "bg-white text-[#0A2540] shadow-sm" : "text-slate-500"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "login" ? (
                <>
                  <Field label="رقم الهاتف أو كود الدخول" name="auth_identifier" placeholder="01X XXXX XXXX" />
                  <Field label="كلمة المرور" name="auth_password" type={showPassword ? "text" : "password"}>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="auth_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 pl-12 text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                </>
              ) : null}

              {view === "signup" && role === "student" ? (
                <>
                  <Field label="اسم الطالب" name="student_name" placeholder="اكتب اسم الطالب" />
                  <Field label="رقم الهاتف" name="student_phone" placeholder="01X XXXX XXXX" />
                  <Field label="رقم ولي الأمر" name="parent_phone" placeholder="01X XXXX XXXX" />
                  <label className="block text-sm font-bold text-[#0A2540]">
                    المرحلة الدراسية
                    <select
                      value={studentStage}
                      onChange={(event) => {
                        const nextStage = event.target.value as StudentStage;
                        setStudentStage(nextStage);
                        setStudentGrade("");
                        setStudentTrack("");
                      }}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                    >
                      <option value="">اختر المرحلة</option>
                      <option value="primary">ابتدائي</option>
                      <option value="prep">إعدادي</option>
                      <option value="secondary">ثانوي</option>
                    </select>
                  </label>
                  {studentStage ? (
                    <label className="block text-sm font-bold text-[#0A2540]">
                      الصف الدراسي
                      <select
                        value={studentGrade}
                        onChange={(event) => setStudentGrade(event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      >
                        <option value="">اختر الصف</option>
                        {stageGrades[studentStage].map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {studentStage === "secondary" && (studentGrade === "الصف الثاني الثانوي" || studentGrade === "الصف الثالث الثانوي") ? (
                    <label className="block text-sm font-bold text-[#0A2540]">
                      القسم
                      <select
                        value={studentTrack}
                        onChange={(event) => setStudentTrack(event.target.value as SecondaryTrack)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      >
                        <option value="">اختر القسم</option>
                        {secondaryTracks.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="block text-sm font-bold text-[#0A2540]">
                    كلمة المرور
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="student_password"
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 pl-12 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </>
              ) : null}

              {view === "signup" && role === "parent" ? (
                <>
                  <Field label="اسم ولي الأمر" name="parent_name" placeholder="الاسم الكامل" />
                  <Field label="رقم الهاتف" name="parent_phone" placeholder="01X XXXX XXXX" />
                  <Field label="كود الطالب للربط" name="parent_link_code" placeholder="VIS-12345" />
                  <Field label="اسم الابن" name="parent_child_name" placeholder="اسم الابن الكامل" />
                  <label className="block text-sm font-bold text-[#0A2540]">
                    كلمة المرور
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="parent_password"
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 pl-12 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </>
              ) : null}

              {view === "signup" && role === "teacher" ? (
                <>
                  <Field label="اسم المعلم" name="teacher_name" placeholder="اكتب اسمك" />
                  <Field label="رقم الهاتف" name="teacher_phone" placeholder="01X XXXX XXXX" />
                  <label className="block text-sm font-bold text-[#0A2540]">
                    المرحلة الدراسية
                    <select
                      value={teacherStage}
                      onChange={(event) => setTeacherStage(event.target.value as TeacherStage)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                    >
                      <option value="">اختر المرحلة</option>
                      {teacherStages.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field label="المواد" name="teacher_subjects" placeholder="مثال: الرياضيات, الفيزياء" />
                  <Field label="اسم المدرسة" name="teacher_school" placeholder="اسم المدرسة" />
                  <Field label="صورة اختيارية" name="teacher_photo" placeholder="رابط الصورة أو اسم الملف" />
                  <label className="block text-sm font-bold text-[#0A2540]">
                    كلمة المرور
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="teacher_password"
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 pl-12 outline-none transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </>
              ) : null}

              {formError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{formError}</div>
              ) : null}
              {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</div>
              ) : null}

              <button
                type={view === "forgot_password" ? "button" : "submit"}
                onClick={() => {
                  if (view === "forgot_password") {
                    router.push("/password-reset/request");
                  }
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A2540] py-4 text-lg font-extrabold text-white shadow-lg transition-all hover:bg-[#123B66]"
              >
                {view === "login" ? "تسجيل الدخول" : view === "signup" ? "إنشاء الحساب" : "استعادة كلمة المرور"}
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </button>
            </form>

            <div className="mt-6 text-center">
              {view === "login" ? (
                <div className="mb-3 text-sm font-bold text-slate-500">
                  <button
                    type="button"
                    onClick={() => router.push("/password-reset/request")}
                    className="underline decoration-2 underline-offset-4 text-[#0A2540]"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              ) : null}

              {view !== "forgot_password" ? (
                <p className="text-sm font-bold text-slate-500">
                  {view === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setView(view === "login" ? "signup" : "login");
                    }}
                    className="underline decoration-2 underline-offset-4 text-[#0A2540]"
                  >
                    {view === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
                  </button>
                </p>
              ) : null}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
}
