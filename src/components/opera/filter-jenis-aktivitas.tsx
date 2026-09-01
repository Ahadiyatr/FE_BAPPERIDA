import type { FilterJenisAktivitas as NilaiFilterJenis } from "@/lib/filter-aktivitas-realisasi"

export function FilterJenisAktivitas({
  nilai,
  onUbah,
}: {
  nilai: NilaiFilterJenis
  onUbah: (nilai: NilaiFilterJenis) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium">Jenis aktivitas</span>
      <select
        aria-label="Jenis aktivitas"
        value={nilai}
        onChange={(event) => onUbah(event.target.value as NilaiFilterJenis)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
      >
        <option value="semua">Semua jenis</option>
        <option value="utama">Utama</option>
        <option value="pendukung">Pendukung</option>
      </select>
    </label>
  )
}
