import { redirect } from "next/navigation";
import { getCurrentAppProfile } from "@/lib/auth/session";
import { StudentWalletClient } from "./wallet-client";

export default async function StudentWalletPage() {
  const profile = await getCurrentAppProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "student") {
    redirect("/student/dashboard");
  }

  return <StudentWalletClient studentName={profile.name} />;
}
