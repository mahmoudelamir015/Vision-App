import { redirect } from "next/navigation";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function ParentProfilePage() {
  const profile = await getCurrentAppProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "parent") {
    redirect(`/${profile.role}/dashboard`);
  }

  return (
    <ProfileEditor
      role="parent"
      title="الملف الشخصي لولي الأمر"
      description="تقدر تعدل الاسم وكلمة المرور فقط، وباقي البيانات المقفولة من خلال طلب تعديل."
      showPhoto={false}
      editableStage={false}
    />
  );
}
