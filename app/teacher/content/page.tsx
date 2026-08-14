import { redirect } from "next/navigation";
import { getCurrentAppSession } from "@/lib/auth/session";
import TeacherContentClient from "./teacher-content-client";

export default async function TeacherContentPage() {
  const session = await getCurrentAppSession();

  if (!session) {
    redirect("/");
  }

  if (session.profile.role !== "teacher") {
    redirect(`/${session.profile.role}/dashboard`);
  }

  return <TeacherContentClient teacherId={session.authUserId} teacherName={session.profile.name} />;
}
