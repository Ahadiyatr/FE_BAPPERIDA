const ASAL_INTERNAL = "https://opera.internal"

/**
 * Menormalkan tujuan setelah login tanpa pernah mengizinkan navigasi keluar
 * origin. Nilai yang tidak aman diabaikan agar kandidat berikutnya atau
 * `/dashboard` dapat dipakai.
 */
export function normalkanTujuanLogin(nilai: unknown): string | null {
  if (typeof nilai !== "string" || nilai === "" || nilai.trim() !== nilai) return null
  if (!nilai.startsWith("/") || nilai.startsWith("//") || nilai.includes("\\")) return null
  if (/\p{Cc}/u.test(nilai)) return null

  try {
    const url = new URL(nilai, ASAL_INTERNAL)
    if (url.origin !== ASAL_INTERNAL || url.pathname === "/login") return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function pilihTujuanLogin(...kandidat: unknown[]): string {
  for (const nilai of kandidat) {
    const tujuan = normalkanTujuanLogin(nilai)
    if (tujuan) return tujuan
  }
  return "/dashboard"
}

export function pathnameTujuanLogin(tujuan: string): string {
  return new URL(tujuan, ASAL_INTERNAL).pathname
}
