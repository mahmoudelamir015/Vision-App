"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Eye, EyeOff, GraduationCap, Lock, User, Users } from "lucide-react";
import { OptionalPhotoPicker } from "@/components/registration/optional-photo-picker";
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

const studentStageOptions: Array<{ value: StudentStage; label: string }> = [
  { value: "primary", label: "ابتدائي" },
  { value: "prep", label: "إعدادي" },
  { value: "secondary", label: "ثانوي" },
];

const teacherStages: Array<{ value: TeacherStage; label: string }> = [
  { value: "primary", label: "ابتدائي" },
  { value: "prep", label: "إعدادي" },
  { value: "secondary", label: "ثانوي" },
];

const panelVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

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
        {children ?? (
          <input
            name={name}
            type={type}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
          />
        )}
      </div>
    </label>
  );
}

type SelectOption = { value: string; label: string };

function AnimatedSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = options.find((item) => item.value === value)?.label ?? "";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <label className="block text-sm font-bold text-[#0A2540]">
      <span>{label}</span>
      <div ref={rootRef} className="relative mt-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-right outline-none transition-all hover:border-slate-300 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
        >
          <span className={selectedLabel ? "text-[#0A2540]" : "text-slate-400"}>{selectedLabel || placeholder}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.span>
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`block w-full px-4 py-3 text-right text-sm font-semibold transition-colors hover:bg-[#FFFCF7] ${
                      active ? "bg-[#FFFCF7] text-[#0A2540]" : "text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>
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
  const [teacherPhotoName, setTeacherPhotoName] = useState<string | null>(null);
  const [teacherPhotoPreview, setTeacherPhotoPreview] = useState<string | null>(null);
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

  const resetSignupState = () => {
    setFormError(null);
    setNotice(null);
    setShowPassword(false);
    setStudentStage("");
    setStudentGrade("");
    setStudentTrack("");
    setTeacherStage("");
    setTeacherPhotoName(null);
    setTeacherPhotoPreview(null);
  };

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
        } else {
          router.push("/student/profile");
        }
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
        } else {
          router.push("/parent/dashboard");
        }
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
        profile_image: teacherPhotoName ?? undefined,
      });
      if (result.requiresPhoneVerification) {
        setNotice("تم إرسال رمز تأكيد للهاتف. أكد الرقم ثم سجّل الدخول.");
        setView("login");
      } else {
        router.push("/teacher/dashboard");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "حدث خطأ أثناء تنفيذ العملية");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4EA] via-white to-[#EEF4FF] p-4 text-[#0A2540] sm:p-8" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(10,37,64,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={panelVariants}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#123B66] to-[#1E5B97] p-8 text-white"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.25),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_38%)]" />
            <div className="relative z-10 max-w-sm text-center">
              <Image src="/logo.png" alt="Vision Center" width={140} height={140} className="mx-auto mb-6 h-28 w-28 object-contain" priority />
              <h1 className="text-3xl font-extrabold leading-tight">منصة رؤية التعليمية</h1>
              <p className="mt-3 text-sm font-semibold text-white/80">
                دخول سريع وآمن للطلاب وأولياء الأمور والمعلمين مع واجهة عربية واضحة وخفيفة.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={panelVariants}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
            className="p-6 sm:p-8"
          >
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
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRole(item.id);
                      resetSignupState();
                    }}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      active ? "bg-white text-[#0A2540] shadow-sm" : "text-slate-500"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={panelVariants}
              transition={{ duration: 0.35, delay: 0.08 }}
            >
              <AnimatePresence mode="wait">
                {view === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
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
                  </motion.div>
                ) : null}

                {view === "signup" && role === "student" ? (
                  <motion.div
                    key="student"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <Field label="اسم الطالب" name="student_name" placeholder="اكتب اسم الطالب" />
                    <Field label="رقم الهاتف" name="student_phone" placeholder="01X XXXX XXXX" />
                    <Field label="رقم ولي الأمر" name="parent_phone" placeholder="01X XXXX XXXX" />
                    <AnimatedSelect
                      label="المرحلة الدراسية"
                      value={studentStage}
                      placeholder="اختر المرحلة"
                      options={studentStageOptions}
                      onChange={(nextStage) => {
                        const typedStage = nextStage as StudentStage;
                        setStudentStage(typedStage);
                        setStudentGrade("");
                        setStudentTrack("");
                      }}
                    />
                    {studentStage ? (
                      <AnimatedSelect
                        label="الصف الدراسي"
                        value={studentGrade}
                        placeholder="اختر الصف"
                        options={stageGrades[studentStage].map((grade) => ({ value: grade, label: grade }))}
                        onChange={setStudentGrade}
                      />
                    ) : null}
                    {studentStage === "secondary" && (studentGrade === "الصف الثاني الثانوي" || studentGrade === "الصف الثالث الثانوي") ? (
                      <AnimatedSelect
                        label="القسم"
                        value={studentTrack}
                        placeholder="اختر القسم"
                        options={secondaryTracks}
                        onChange={(nextTrack) => setStudentTrack(nextTrack as SecondaryTrack)}
                      />
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
                  </motion.div>
                ) : null}

                {view === "signup" && role === "parent" ? (
                  <motion.div
                    key="parent"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
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
                  </motion.div>
                ) : null}

                {view === "signup" && role === "teacher" ? (
                  <motion.div
                    key="teacher"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <Field label="اسم المعلم" name="teacher_name" placeholder="اكتب اسمك" />
                    <Field label="رقم الهاتف" name="teacher_phone" placeholder="01X XXXX XXXX" />
                    <AnimatedSelect
                      label="المرحلة الدراسية"
                      value={teacherStage}
                      placeholder="اختر المرحلة"
                      options={teacherStages}
                      onChange={(nextStage) => setTeacherStage(nextStage as TeacherStage)}
                    />
                    <Field label="المواد" name="teacher_subjects" placeholder="مثال: الرياضيات, الفيزياء" />
                    <Field label="اسم المدرسة" name="teacher_school" placeholder="اسم المدرسة" />
                    <OptionalPhotoPicker
                      label="صورة اختيارية"
                      description="اختياري تماماً، ويمكنك إكمال التسجيل بدون صورة."
                      fileName={teacherPhotoName}
                      previewUrl={teacherPhotoPreview}
                      onChange={(fileName, previewUrl) => {
                        setTeacherPhotoName(fileName);
                        setTeacherPhotoPreview(previewUrl);
                      }}
                    />
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
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {formError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  >
                    {formError}
                  </motion.div>
                ) : null}
                {notice ? (
                  <motion.div
                    key="notice"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
                  >
                    {notice}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <motion.button
                type={view === "forgot_password" ? "button" : "submit"}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (view === "forgot_password") {
                    router.push("/password-reset/request");
                  }
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A2540] py-4 text-lg font-extrabold text-white shadow-lg transition-all hover:bg-[#123B66]"
              >
                {view === "login" ? "تسجيل الدخول" : view === "signup" ? "إنشاء الحساب" : "استعادة كلمة المرور"}
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </motion.button>
            </motion.form>

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
                      resetSignupState();
                      setView(view === "login" ? "signup" : "login");
                    }}
                    className="underline decoration-2 underline-offset-4 text-[#0A2540]"
                  >
                    {view === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
                  </button>
                </p>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
