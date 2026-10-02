export const PETUNJUK_KEBIJAKAN_KATA_SANDI =
  'Minimal 12 karakter, berisi huruf dan angka.';

export function memenuhiKebijakanKataSandi(sandi: string): boolean {
  return sandi.length >= 12 && /[A-Za-z]/.test(sandi) && /\d/.test(sandi);
}
