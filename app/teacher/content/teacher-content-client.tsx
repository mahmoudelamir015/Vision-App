"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Plus, Upload } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getSupabaseClient } from "@/lib/supabase";
import { createTeacherMaterial, fetchTeacherMaterials, type TeacherMaterialRecord } from "@/lib/supabase/teacher-materials";
import { fetchNotifications, type NotificationRecord } from "@/lib/supabase/notifications";
import { fetchSystemSettings, subscribeToSystemSettings } from "@/lib/supabase/system-settings";
import { LayoutDashboard, User, BookOpen, PieChart, FileEdit, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

const navItems: DashboardNavItem[] = [
  { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { id: "profile", label: "حسابي", icon: User },
  { id: "groups", label: "الصفوف", icon: GraduationCap },
  { id: "exam-builder", label: "بناء الامتحان", icon: FileEdit },
  { id: "content", label: "المحتوى التعليمي", icon: BookOpen },
  { id: "reports", label: "التقارير", icon: PieChart },
];

type Props = {
  teacherId: string;
  teacherName: string;
};

type UploadFormState = {
  title: string;
  price: string;
};

const initialFormState: UploadFormState = {
  title: "",
  price: "0",
};

function formatPrice(value: number) {
  return `${value.toLocaleString("ar-EG")} جنيه`;
}

export default function TeacherContentClient({ teacherId, teacherName }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]["id"]>("content");
  const [materials, setMaterials] = useState<TeacherMaterialRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState<UploadFormState>(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();
        if (!isMounted) return;
        setWalletEnabled(Boolean(settings?.wallet_enabled));
      } finally {
        if (isMounted) setIsLoadingSettings(false);
      }
    };

    void loadSettings();

    const unsubscribe = subscribeToSystemSettings((settings) => {
      if (isMounted) setWalletEnabled(Boolean(settings.wallet_enabled));
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTeacherContent = async () => {
      const [items, notificationRows] = await Promise.all([fetchTeacherMaterials(teacherId), fetchNotifications()]);
      if (!isMounted) return;

      setMaterials(items);
      setNotifications(notificationRows);
    };

    void loadTeacherContent();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const totalRevenue = useMemo(() => materials.reduce((sum, item) => sum + Number(item.price || 0), 0), [materials]);

  const notificationsPanel = (
    <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/5 dark:bg-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0A2540] dark:text-white">الإشعارات</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {notifications.length} جديدة
        </span>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, 3).map((notification) => (
            <div key={notification.id ?? notification.title} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <h4 className="text-sm font-extrabold text-[#0A2540] dark:text-white">{notification.title}</h4>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{notification.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="لا توجد إشعارات جديدة"
          description="أي تحديث جديد من الإدارة أو من الطلاب سيظهر هنا."
        />
      )}
    </div>
  );

  const userBadge = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2540] text-sm font-black text-white dark:bg-[#D4AF37] dark:text-[#0A2540]">
        {teacherName.trim().charAt(0) || "T"}
      </div>
      <div className="flex flex-col pl-4">
        <span className="text-sm font-extrabold leading-tight text-[#0A2540] dark:text-[#D4AF37]">المعلم</span>
        <span className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">لوحة المحتوى التعليمي</span>
      </div>
    </>
  );

  const handleTabChange = (tab: string) => {
    if (tab === "profile") {
      router.push("/teacher/profile");
      return;
    }
    if (tab === "exam-builder") {
      router.push("/teacher/exam-builder");
      return;
    }
    if (tab === "dashboard") {
      router.push("/teacher/dashboard");
      return;
    }
    setActiveTab(tab as (typeof navItems)[number]["id"]);
  };

  const openUploadModal = () => {
    setFeedback(null);
    setForm(initialFormState);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const submitUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.title.trim()) {
      setFeedback({ type: "error", message: "من فضلك اكتب اسم المحتوى قبل الحفظ." });
      return;
    }

    if (!selectedFile) {
      setFeedback({ type: "error", message: "من فضلك اختار ملف PDF أو Word." });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setFeedback({ type: "error", message: "خدمة الرفع غير مهيأة حالياً." });
      return;
    }

    setUploading(true);

    try {
      const safeFileName = selectedFile.name.replace(/[^\w.-]+/g, "_");
      const storagePath = `${teacherId}/${Date.now()}-${safeFileName}`;
      const uploadResult = await client.storage.from("teacher_materials").upload(storagePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || "حدث خطأ أثناء رفع الملف.");
      }

      const { data: publicUrlData } = client.storage.from("teacher_materials").getPublicUrl(storagePath);
      const saved = await createTeacherMaterial({
        teacher_user_id: teacherId,
        title: form.title.trim(),
        description: null,
        file_url: publicUrlData.publicUrl,
        file_name: selectedFile.name,
        file_type: selectedFile.type || null,
        price: Number(form.price || 0),
        published: true,
      });

      if (!saved) {
        throw new Error("تم رفع الملف لكن تعذر حفظ البيانات في الجدول.");
      }

      setMaterials((current) => [saved, ...current]);
      setIsModalOpen(false);
      setForm(initialFormState);
      setSelectedFile(null);
      setFeedback({ type: "success", message: "تم رفع المحتوى وحفظه بنجاح." });
    } catch (error) {
      console.error("Failed to upload teacher material", error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء الرفع.",
      });
    } finally {
      setUploading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الملفات</p>
          <h3 className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">{materials.length}</h3>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي القيمة</p>
          <h3 className="mt-2 text-3xl font-black text-[#0A2540] dark:text-white">{formatPrice(totalRevenue)}</h3>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</p>
          <h3 className="mt-2 text-2xl font-extrabold text-[#0A2540] dark:text-white">
            {isLoadingSettings ? "جاري التحميل..." : walletEnabled ? "المحتوى جاهز للعرض" : "المزامنة متوقفة"}
          </h3>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[#0A2540] dark:text-white">المحتوى التعليمي</h3>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              أضف ملفات PDF أو Word وحدد سعرها قبل النشر على المنصة.
            </p>
          </div>
          <button
            type="button"
            onClick={openUploadModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            رفع محتوى جديد
          </button>
        </div>

        {materials.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {materials.map((material) => (
              <div key={material.id ?? material.file_url} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-lg font-extrabold text-[#0A2540] dark:text-white">{material.title}</h4>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                      {material.file_name ?? "ملف مرفوع"} {material.file_type ? `• ${material.file_type}` : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                    <p className="text-xs font-bold text-amber-700">السعر</p>
                    <p className="mt-1 text-xl font-black text-amber-700">{formatPrice(Number(material.price || 0))}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0A2540] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح الملف
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={Upload}
              title="لا يوجد محتوى مرفوع حتى الآن"
              description="اضغط على زر رفع محتوى جديد لإضافة أول ملف ومشاركته مع الطلاب."
              actionLabel="رفع محتوى جديد"
              onAction={openUploadModal}
            />
          </div>
        )}
      </section>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <DashboardShell
        brandTitle="بوابة المعلم"
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={() => router.push("/")}
        userBadge={userBadge}
        notifications={notificationsPanel}
      >
        <div className="mx-auto max-w-6xl">{content}</div>
      </DashboardShell>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-white/10 dark:bg-[#0A2540]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-[#0A2540] dark:text-white">رفع محتوى جديد</h2>
                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                  اكتب اسم المحتوى، اختار الملف، وحدد السعر قبل الحفظ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:w-auto"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={submitUpload} className="flex flex-col gap-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="اسم المحتوى"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />

              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[#0A2540] file:px-4 file:py-2 file:font-bold file:text-white dark:border-white/10 dark:bg-black/20"
              />

              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="السعر"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
              />

              {selectedFile ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  الملف المختار: {selectedFile.name}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-[#D4AF37] hover:text-[#0A2540] dark:border-white/10 dark:text-slate-300 sm:w-auto"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 font-bold text-white transition-colors hover:bg-[#123B66] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#D4AF37] dark:text-[#0A2540] sm:w-auto"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "جاري الرفع..." : "حفظ المحتوى"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
