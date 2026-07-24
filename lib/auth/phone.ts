export function normalizeEgyptianPhone(phone: string): string | null {
  const digits = phone.trim().replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!digits) return null;

  const local = digits.startsWith("20") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^1\d{9}$/.test(local)) return null;

  return `+20${local}`;
}
