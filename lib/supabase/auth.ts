import { getSupabaseClient } from "./index";

const normalizePhoneCandidate = (phone: string) => {
  const trimmed = phone.trim().replace(/\s+/g, "");
  const compact = trimmed.replace(/[^\d+]/g, "");
  if (!compact) return null;
  if (compact.startsWith("+")) return compact;
  const digits = compact.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `+20${digits.replace(/^0/, "")}`;
  if (digits.startsWith("20")) return `+${digits}`;
  return `+20${digits}`;
};

export async function sendUserSignupOtp(phone: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase غير مضبوط");
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  return client.auth.signInWithOtp({
    phone: normalized,
    options: { shouldCreateUser: true },
  });
}

export async function verifyUserOtp(phone: string, token: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase غير مضبوط");
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  return client.auth.verifyOtp({ phone: normalized, token, type: "sms" });
}

export async function sendPasswordResetOtp(phone: string) {
  // reuse signInWithOtp to send SMS OTP for password reset
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase غير مضبوط");
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  return client.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: false } });
}

export async function verifyOtpAndSetPassword(phone: string, token: string, newPassword: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase غير مضبوط");
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) throw new Error("رقم موبايل غير صالح");

  // verify OTP (this should create a session)
  const res = await client.auth.verifyOtp({ phone: normalized, token, type: "sms" });
  if (res.error) throw res.error;

  // update password for the signed-in user
  const { data, error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}
