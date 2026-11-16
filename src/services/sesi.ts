import type { PeranPengguna, User } from "./types"

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

export function pelakuDariUser(u: User): Pelaku {
  return { id: u.id, nama: u.name, peran: u.role, bidangId: u.bidangId }
}
