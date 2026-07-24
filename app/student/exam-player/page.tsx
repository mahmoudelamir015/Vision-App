import { redirect } from "next/navigation";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { ExamPlayerClient } from "./exam-player-client";

type ExamPlayerPageProps = {
  searchParams?: Promise<{
    examId?: string;
  }>;
};

export default async function ExamPlayerPage({ searchParams }: ExamPlayerPageProps) {
  const profile = await getCurrentAppProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "student") {
    redirect("/student/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ExamPlayerClient examId={resolvedSearchParams?.examId ?? ""} />;
}
