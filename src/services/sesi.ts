import type { PeranPengguna, User } from "./types"

/**
 * Pelaku yang sedang bertindak — sumber `createdBy` dan jejak audit.
 *
 * SEMENTARA: diisi dari saklar peran dummy di PenyediaPeran. Fase 6
 * menggantinya dengan pengguna dari sesi login sungguhan; yang berubah
 * hanya pemanggil `setPelaku()`, bukan satu pun service yang membacanya.
 *
 * Sengaja disimpan di modul, bukan diteruskan sebagai parameter tiap
 * fungsi — backend pun mengambil pelaku dari sesi, bukan dari body request.
 */
export interface Pelaku {
  id: number
  nama: string
  peran: Exclude<PeranPengguna, "publik">
  bidangId: number | null
}

let pelaku: Pelaku | null = null

export function setPelaku(p: Pelaku | null): void {
  pelaku = p
}

export function getPelaku(): Pelaku | null {
  return pelaku
}

/** Pelaku untuk pencatatan. Publik tidak pernah menulis, jadi null aman. */
export function pelakuDariUser(u: User): Pelaku {
  return { id: u.id, nama: u.name, peran: u.role, bidangId: u.bidangId }
}
