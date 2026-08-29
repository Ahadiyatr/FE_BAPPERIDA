import * as React from "react"
import { Plus } from "lucide-react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getBidang, getUsers, setAktifUser, simpanUser } from "@/services"
import type { Bidang, PeranPengguna, User } from "@/services"
import { Panel, Th } from "./bagian/ui"

type PeranAkun = Exclude<PeranPengguna, "publik">
const LABEL: Record<PeranAkun, string> = {
  admin_aplikasi: "Admin aplikasi",
  admin_bidang: "Admin bidang",
}

export default function ManajemenPengguna() {
  const [users, setUsers] = React.useState<User[]>([])
  const [bidangs, setBidangs] = React.useState<Bidang[]>([])
  const [galat, setGalat] = React.useState<string | null>(null)
  const [laci, setLaci] = React.useState<User | null | undefined>(undefined)
  const [konfirmasi, setKonfirmasi] = React.useState<User | null>(null)

  const muat = React.useCallback(async () => {
    const [u, b] = await Promise.all([getUsers({ termasukNonaktif: true }), getBidang()])
    setUsers(u); setBidangs(b)
  }, [])
  React.useEffect(() => { void muat() }, [muat])

  const namaBidang = (id: number | null) =>
    id == null ? "—" : (bidangs.find((b) => b.id === id)?.namaBidang ?? `#${id}`)

  async function ubahAktif(u: User) {
    setGalat(null)
    try { await setAktifUser(u.id, !u.flagActive); await muat() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal mengubah status.") }
    finally { setKonfirmasi(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            Satu pengguna memegang satu bidang. Admin aplikasi tidak terikat bidang —
            cakupannya seluruh perangkat daerah.
          </p>
        </div>
        <Button onClick={() => setLaci(null)}><Plus className="w-3.5 h-3.5" /> Tambah pengguna</Button>
      </div>

      {galat && <div className="p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</div>}

      <Panel>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr><Th>Nama</Th><Th>Email</Th><Th>Peran</Th><Th>Bidang</Th><Th>Status</Th><Th kanan>Tindakan</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.flagActive ? "hover:bg-slate-50" : "opacity-55"}>
                <td className="px-6 py-3 text-sm font-medium text-slate-800">{u.name}</td>
                <td className="px-6 py-3 text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                    u.role === "admin_aplikasi" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>{LABEL[u.role]}</span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{namaBidang(u.bidangId)}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-semibold uppercase ${u.flagActive ? "text-emerald-700" : "text-slate-400"}`}>
                    {u.flagActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setLaci(u)}>Ubah</Button>
                  <Button size="sm" variant="ghost" onClick={() => setKonfirmasi(u)}>
                    {u.flagActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {laci !== undefined && (
        <LaciPengguna
          awal={laci} bidangs={bidangs}
          onTutup={() => setLaci(undefined)} onTersimpan={() => void muat()}
        />
      )}

      <AlertDialog open={konfirmasi !== null} onOpenChange={(o) => !o && setKonfirmasi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan"} {konfirmasi?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.flagActive
                ? "Akun tidak dihapus — catatan realisasi menyimpan nama pencatatnya, jadi jejaknya harus tetap bisa ditelusuri."
                : "Akun ini bisa masuk lagi dan mencatat realisasi untuk bidangnya."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => konfirmasi && void ubahAktif(konfirmasi)}>
              {konfirmasi?.flagActive ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LaciPengguna({
  awal, bidangs, onTutup, onTersimpan,
}: {
  awal: User | null
  bidangs: Bidang[]
  onTutup: () => void
  onTersimpan: () => void
}) {
  const [name, setName] = React.useState(awal?.name ?? "")
  const [email, setEmail] = React.useState(awal?.email ?? "")
  const [role, setRole] = React.useState<PeranAkun>(awal?.role ?? "admin_bidang")
  const [bidangId, setBidangId] = React.useState<number | null>(awal?.bidangId ?? bidangs[0]?.id ?? null)
  const [galat, setGalat] = React.useState<string | null>(null)

  async function simpan() {
    setGalat(null)
    try {
      await simpanUser({ id: awal?.id, name, email, role, bidangId })
      onTersimpan(); onTutup()
    } catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
  }

  const gaya = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"

  return (
    <Sheet open onOpenChange={(o) => !o && onTutup()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{awal ? "Ubah pengguna" : "Pengguna baru"}</SheetTitle>
          <SheetDescription>
            Admin bidang wajib ditempatkan di satu bidang. Admin aplikasi tidak.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-3">
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Nama</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Peran</span>
            <select className={gaya} value={role} onChange={(e) => setRole(e.target.value as PeranAkun)}>
              <option value="admin_bidang">Admin bidang</option>
              <option value="admin_aplikasi">Admin aplikasi</option>
            </select>
          </label>
          {role === "admin_bidang" && (
            <label className="block">
              <span className="block mb-1 text-xs font-semibold tracking-wider uppercase text-slate-500">Bidang</span>
              <select
                className={gaya}
                value={bidangId ?? ""}
                onChange={(e) => setBidangId(Number(e.target.value))}
              >
                {bidangs.map((b) => <option key={b.id} value={b.id}>{b.namaBidang}</option>)}
              </select>
            </label>
          )}
          {galat && <p className="px-3 py-2 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">{galat}</p>}
        </div>

        <SheetFooter>
          <Button onClick={() => void simpan()} disabled={!name || !email}>Simpan</Button>
          <Button variant="ghost" onClick={onTutup}>Batal</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
