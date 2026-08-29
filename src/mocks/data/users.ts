// USERS. Domain email sengaja "@bapperida.local" supaya jelas ini akun
// contoh, bukan alamat sungguhan.
//
// Keputusan produk 28 Agustus 2026: SATU USER MEMEGANG SATU BIDANG.
// Karena itu tabel pivot USER_BIDANG di docs/erd.md (perubahan #7) tidak
// jadi diperlukan — cukup satu kolom BIDANG_ID di tabel users.
// Yang tetap perlu diperbaiki dari skema lama: relasinya harus
// restrictOnDelete, bukan nullOnDelete, supaya menghapus bidang tidak
// diam-diam membuat scope query jadi null (CLAUDE.md masalah #3).
import type { User } from "@/services/types"

export const users: User[] = [
  { id: 1, name: "Ratna Dewi", email: "ratna.dewi@bapperida.local", role: "admin_aplikasi", bidangId: null, flagActive: true },
  { id: 2, name: "Agus Prasetyo", email: "agus.prasetyo@bapperida.local", role: "admin_bidang", bidangId: 1, flagActive: true }, // P2EPD
  { id: 3, name: "Yulianti Rahayu", email: "yulianti.rahayu@bapperida.local", role: "admin_bidang", bidangId: 2, flagActive: true }, // Sekretariat
  { id: 4, name: "Siti Handayani", email: "siti.handayani@bapperida.local", role: "admin_bidang", bidangId: 3, flagActive: true }, // PIK
  { id: 5, name: "Fajar Nugroho", email: "fajar.nugroho@bapperida.local", role: "admin_bidang", bidangId: 4, flagActive: true }, // RINOVA
  { id: 6, name: "Bambang Wijaya", email: "bambang.wijaya@bapperida.local", role: "admin_bidang", bidangId: 5, flagActive: true }, // Subbag Perencanaan
  { id: 7, name: "Dian Kusuma", email: "dian.kusuma@bapperida.local", role: "admin_bidang", bidangId: 6, flagActive: true }, // PPM
  { id: 8, name: "Hendra Saputra", email: "hendra.saputra@bapperida.local", role: "admin_bidang", bidangId: 7, flagActive: true }, // Keuangan
]

export const usersByBidang = (bidangId: number): User[] =>
  users.filter((u) => u.bidangId === bidangId)
