// ─────────────────────────────────────────────────────────────
// Reusable validation helpers for ParkPoint Solutions forms
// ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;

export const isEmail = (v) => EMAIL_RE.test((v || '').trim());
export const isName = (v) => NAME_RE.test((v || '').trim());
export const isPhone = (v) => /^\d{8}$/.test((v || '').trim());
export const isUsername = (v) => {
  const s = (v || '').trim();
  return s.length >= 4 && s.length <= 20 && USERNAME_RE.test(s);
};

// Password strength: 0 (none) .. 4 (very strong)
export function passwordStrength(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
export const STRENGTH_CLASS = ['on-weak', 'on-weak', 'on-medium', 'on-strong', 'on-strong'];

// A password is acceptable if ≥8 chars AND has a letter and a number
export const isStrongEnough = (pw = '') =>
  pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

// ── Credit-card validators ────────────────────────────────────

// Luhn checksum — validates real card number structure
export function luhnValid(number = '') {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Expiry "MM/YY" must be a valid month and not in the past
export function expiryValid(exp = '') {
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59); // last day of that month
  return endOfMonth >= now;
}

// CVV: 4 digits for Amex (starts with 3), otherwise 3
export function cvvValid(cvv = '', cardNumber = '') {
  const clean = cvv.replace(/\D/g, '');
  const isAmex = cardNumber.replace(/\D/g, '').startsWith('3');
  return isAmex ? clean.length === 4 : clean.length === 3;
}
