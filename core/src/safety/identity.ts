/**
 * Normalizing emails, phones and names so that "Noa.Cohen@Gmail.com " and
 * "noa.cohen@gmail.com", or "054-123 4567" and "+972541234567", count as the same.
 */

export function normalizeEmail(email: string | undefined): string | undefined {
  const e = email?.trim().toLowerCase();
  return e && e.includes("@") ? e : undefined;
}

/**
 * Returns a phone number in international form ("+972541234567").
 * Israeli local numbers ("054-1234567", "03-1234567") get the +972 prefix.
 */
export function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const hadPlus = phone.trim().startsWith("+");
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (!hadPlus) {
    if (digits.startsWith("0") && (digits.length === 10 || digits.length === 9)) digits = "972" + digits.slice(1);
    else if (digits.length === 9 && digits.startsWith("5")) digits = "972" + digits;
  }
  if (digits.startsWith("9720")) digits = "972" + digits.slice(4); // "+972 054..." written with the trunk 0
  return digits.length >= 8 ? "+" + digits : undefined;
}

export function lastDigits(phone: string | undefined, n = 4): string | undefined {
  const d = phone?.replace(/\D/g, "");
  return d && d.length >= n ? d.slice(-n) : undefined;
}

/** Lowercase, without punctuation, niqqud or extra spaces. Works for Hebrew and Latin names. */
export function normalizeName(name: string | undefined): string {
  return (name ?? "")
    .normalize("NFKD")
    .replace(/[֑-ׇ]/g, "") // Hebrew niqqud and cantillation marks
    .replace(/[̀-ͯ]/g, "") // Latin accents
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
