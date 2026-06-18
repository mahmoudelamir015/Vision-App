"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Moon,
  Phone,
  Sun,
  User,
  Users,
} from "lucide-react";
import { fetchSystemSettings, subscribeToSystemSettings } from "@/lib/supabase/system-settings";
import { saveUser } from "@/lib/supabase/users";

type Role = "student" | "parent" | "teacher";
type ViewState = "login" | "signup" | "forgot_password";
type StudentStage = "" | "primary" | "prep" | "secondary";
type SecondaryTrack = "" | "arts" | "science" | "math";
type TeacherStage = "" | "primary" | "prep" | "secondary";

const roleTabs: Array<{ id: Role; label: string; icon: typeof User }> = [
  { id: "student", label: "طالب", icon: User },
  { id: "parent", label: "ولي أمر", icon: Users },
  { id: "teacher", label: "معلم", icon: GraduationCap },
];

const stageGrades: Record<Exclude<StudentStage, "">, string[]> = {
  primary: [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  prep: [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  secondary: [
    "الصف الأول الثانوي ",
    "الصف الثاني الثانوي ",
    "الصف الثالث الثانوي ",
  ],
};

const secondaryTracks: Array<{ value: SecondaryTrack; label: string }> = [
  { value: "arts", label: "أدبي" },
  { value: "science", label: "علمي علوم" },
  { value: "math", label: "علمي رياضة" },
];

const teacherStages: Array<{ value: TeacherStage; label: string }> = [
  { value: "primary", label: "ابتدائي" },
  { value: "prep", label: "إعدادي" },
  { value: "secondary", label: "ثانوي" },
];

export default function AuthPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<ViewState>("login");
  const [role, setRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const [studentStage, setStudentStage] = useState<StudentStage>("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentTrack, setStudentTrack] = useState<SecondaryTrack>("");
  const [teacherStage, setTeacherStage] = useState<TeacherStage>("");
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const settings = await fetchSystemSettings();
      if (!isMounted) return;
      setRegistrationOpen(Boolean(settings?.registration_open ?? true));
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (isMounted) {
        setRegistrationOpen(Boolean(settings.registration_open));
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode((current) => !current);
  };

  const submitTarget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (view === "login") {
      const formData = new FormData(event.currentTarget);
      const identifier = String(formData.get("auth_identifier") ?? "").trim();
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("appUserRole", role);
          if (identifier) localStorage.setItem("appUserPhone", identifier);
        }
      } catch (e) {
        // ignore
      }

      if (role === "student") router.push("/student/dashboard");
      if (role === "parent") router.push("/parent/dashboard");
      if (role === "teacher") router.push("/teacher/dashboard");
      return;
    }

    const formData = new FormData(event.currentTarget);

    if (view === "signup" && !registrationOpen) {
      return;
    }

    if (role === "student") {
      await saveUser({
        name: String(formData.get("student_name") ?? "").trim(),
        phone: String(formData.get("student_phone") ?? "").trim(),
        role: "student",
        stage: studentStage,
        grade: studentGrade,
        track: studentTrack,
        parent_phone: String(formData.get("parent_phone") ?? "").trim() || undefined,
      });
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('appUserRole', 'student');
          localStorage.setItem('appUserPhone', String(formData.get('student_phone') ?? '').trim());
        }
      } catch (e) {}
      router.push("/student/dashboard");
      return;
    }

    if (role === "parent") {
      await saveUser({
        name: String(formData.get("parent_name") ?? "").trim(),
        phone: String(formData.get("parent_phone") ?? "").trim(),
        role: "parent",
        student_code: String(formData.get("parent_link_code") ?? "").trim() || undefined,
        extra: {
          child_name: String(formData.get("parent_child_name") ?? "").trim(),
        },
      });
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('appUserRole', 'parent');
          localStorage.setItem('appUserPhone', String(formData.get('parent_phone') ?? '').trim());
        }
      } catch (e) {}
      router.push("/parent/dashboard");
      return;
    }

    await saveUser({
      name: String(formData.get("teacher_name") ?? "").trim(),
      phone: String(formData.get("teacher_phone") ?? "").trim(),
      role: "teacher",
      stage: teacherStage,
      school_name: String(formData.get("teacher_school") ?? "").trim() || undefined,
      subjects: String(formData.get("teacher_subjects") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      extra: {
        photo_name: String(formData.get("teacher_photo") ?? "").trim() || undefined,
      },
    });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('appUserRole', 'teacher');
        localStorage.setItem('appUserPhone', String(formData.get('teacher_phone') ?? '').trim());
      }
    } catch (e) {}
    router.push("/teacher/dashboard");
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]" dir="rtl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut", repeatType: "reverse", repeat: Infinity }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-[#D4AF37] blur-[100px] opacity-20" />
          <Image
            src="/logo.png"
            alt="Vision Educational Center"
            width={256}
            height={256}
            className="relative z-10 mx-auto h-48 w-48 object-contain md:h-64 md:w-64"
            priority
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 font-cairo transition-colors duration-300 dark:bg-[#061524]" dir="rtl">
      <div className="absolute left-6 top-6 z-50">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="rounded-full border border-black/5 bg-white p-3 text-slate-600 shadow-sm transition-transform hover:scale-105 dark:border-white/5 dark:bg-[#061524] dark:text-slate-300"
        >
          {isDarkMode ? <Sun className="h-6 w-6 text-[#D4AF37]" /> : <Moon className="h-6 w-6 text-[#0A2540]" />}
        </button>
      </div>

      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/20 blur-[120px] dark:bg-[#D4AF37]/10" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[150px] dark:bg-blue-500/5" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/75 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#0A2540]/65 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] md:p-10">
          <div className="absolute left-1/2 top-0 h-1 w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

          <div className="mb-8 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={96}
              height={96}
              className="mb-4 h-24 w-24 object-contain drop-shadow-xl"
              priority
            />
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-[#0A2540] dark:text-white">
              {view === "login" ? "تسجيل الدخول" : view === "signup" ? "إنشاء حساب جديد" : "استعادة كلمة المرور"}
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-white/60">
              {view === "forgot_password"
                ? "أدخل رقم الهاتف المرتبط بالحساب"
                : "مرحباً بك في منصة رؤية التعليمية"}
            </p>
          </div>

          {view !== "forgot_password" ? (
            <div className="mb-8 flex rounded-2xl border border-black/5 bg-slate-200/50 p-1 dark:border-white/5 dark:bg-black/20">
              {roleTabs.map((item) => {
                const Icon = item.icon;
                const active = role === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRole(item.id);
                      setShowPassword(false);
                      setStudentStage("");
                      setStudentGrade("");
                      setStudentTrack("");
                      setTeacherStage("");
                    }}
                    className={`relative flex-1 py-3 text-sm font-bold transition-colors ${
                      active
                        ? "text-white dark:text-[#0A2540]"
                        : "text-slate-500 hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {active ? (
                      <motion.div
                        layoutId="role-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-[#0A2540] shadow-lg dark:bg-gradient-to-br dark:from-[#D4AF37] dark:to-yellow-500"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    ) : null}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.form
              key={`${view}-${role}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={submitTarget}
              className="space-y-5"
            >
              {view === "signup" && role === "student" ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    الاسم الرباعي
                    <input
                      type="text"
                      name="student_name"
                      placeholder="أدخل اسمك الكامل"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    المرحلة الدراسية
                    <select
                      name="student_stage"
                      value={studentStage}
                      onChange={(event) => {
                        const nextStage = event.target.value as StudentStage;
                        setStudentStage(nextStage);
                        setStudentGrade("");
                        setStudentTrack("");
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white"
                    >
                      <option value="">اختر المرحلة</option>
                      <option value="primary">المرحلة الابتدائية</option>
                      <option value="prep">المرحلة الإعدادية</option>
                      <option value="secondary">المرحلة الثانوية</option>
                    </select>
                  </label>

                  {studentStage ? (
                    <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                      الصف الدراسي
                      <select
                        name="student_grade"
                        value={studentGrade}
                        onChange={(event) => setStudentGrade(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white"
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
                    <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                      الشعبة
                      <select
                        name="student_track"
                        value={studentTrack}
                        onChange={(event) => setStudentTrack(event.target.value as SecondaryTrack)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white"
                      >
                        <option value="">اختر الشعبة</option>
                        {secondaryTracks.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    كلمة المرور
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="student_password"
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 pl-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors hover:text-[#0A2540] dark:text-white/40 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </div>
              ) : null}

              {view === "signup" && role === "parent" ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    اسم ولي الأمر
                    <input
                      type="text"
                      name="parent_name"
                      placeholder="الاسم الكامل"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    رقم الهاتف
                    <input
                      type="tel"
                      name="parent_phone"
                      placeholder="01X XXXX XXXX"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    كود الطالب للربط
                    <input
                      type="text"
                      name="parent_link_code"
                      placeholder="مثال: VIS-12345"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-mono font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    كلمة المرور
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="parent_password"
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 pl-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors hover:text-[#0A2540] dark:text-white/40 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </div>
              ) : null}

              {view === "signup" && role === "teacher" ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    الاسم
                    <input
                      type="text"
                      placeholder="أدخل اسمك"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    رقم الهاتف
                    <input
                      type="tel"
                      placeholder="01X XXXX XXXX"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    المرحلة الدراسية
                    <select
                      value={teacherStage}
                      onChange={(event) => setTeacherStage(event.target.value as TeacherStage)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white"
                    >
                      <option value="">اختر المرحلة</option>
                      {teacherStages.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    المادة التي تدرسها
                    <input
                      type="text"
                      placeholder="مثال: الرياضيات، الفيزياء"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                    />
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    كلمة المرور
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 pl-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors hover:text-[#0A2540] dark:text-white/40 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </div>
              ) : null}

              {view === "forgot_password" ? (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    رقم الهاتف المرتبط بالحساب
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Phone className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type="tel"
                        placeholder="01X XXXX XXXX"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                  </label>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    رقم الهاتف أو كود الدخول
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Phone className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type="text"
                        name="auth_identifier"
                        placeholder="01X XXXX XXXX"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-bold text-[#0A2540]/80 dark:text-white/80">
                    كلمة المرور
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-11 pl-11 font-medium text-[#0A2540] outline-none transition-all placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors hover:text-[#0A2540] dark:text-white/40 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type={view === "forgot_password" ? "button" : "submit"}
                onClick={() => {
                  if (view === "forgot_password") {
                    setView("login");
                  }
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] py-4 text-lg font-extrabold text-white shadow-lg transition-all hover:shadow-xl dark:bg-gradient-to-r dark:from-[#D4AF37] dark:to-yellow-600 dark:text-[#0A2540]"
              >
                {view === "login" ? "تأكيد الدخول" : view === "signup" ? "إنشاء حساب جديد" : "إرسال رمز الاستعادة"}
                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-8 text-center">
            {view === "forgot_password" ? (
              <p className="text-sm font-bold text-slate-500 dark:text-white/60">
                تذكرت كلمة المرور؟
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="ml-1 underline decoration-2 underline-offset-4 text-[#0A2540] transition-colors hover:text-black dark:text-[#D4AF37] dark:hover:text-white"
                >
                  العودة لتسجيل الدخول
                </button>
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-500 dark:text-white/60">
                {view === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
                <button
                  type="button"
                  onClick={() => setView(view === "login" ? "signup" : "login")}
                  className="underline decoration-2 underline-offset-4 text-[#0A2540] transition-colors hover:text-black dark:text-[#D4AF37] dark:hover:text-white"
                >
                  {view === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
                </button>
              </p>
            )}
          </div>

          {view === "signup" ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              تجهيز الواجهة للربط مع Supabase Auth وقواعد البيانات مستمر، والحقول هنا متقسمة حسب الدور والمرحلة.
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
