import { redirect } from "next/navigation";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function TeacherProfilePage() {
  const profile = await getCurrentAppProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "teacher") {
    redirect(`/${profile.role}/dashboard`);
  }

  return (
    <ProfileEditor
      role="teacher"
      title="الملف الشخصي للمعلم"
      description="تقدر تعدل الاسم والمرحلة والصورة وكلمة المرور، وباقي البيانات المقفولة من خلال طلب تعديل."
      showPhoto
      editableStage
    />
  );
}
