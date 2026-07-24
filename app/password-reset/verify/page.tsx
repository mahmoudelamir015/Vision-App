import { Suspense } from "react";
import PasswordResetVerifyForm from "./verify-form";

export default function PasswordResetVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md p-6">
          <h1 className="text-2xl font-bold">جاري التحميل...</h1>
        </div>
      }
    >
      <PasswordResetVerifyForm />
    </Suspense>
  );
}
