import * as React from "react"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { LedgerTambahPendukung } from "@/components/opera/bobot-ledger"
import { Eyebrow } from "@/components/opera/primitives"
import {
  getDokumen, getProgram, getProgramById, getKegiatanByProgram, getKegiatanById,
  getSubkegiatanByKegiatan, getSubkegiatanById,
  getAktifitasByIndikatorUtama, simpanProgram, simpanKegiatan, simpanSubkegiatan, simpanAktifitas,
} from "@/services"
import type { Dokumen } from "@/services"
import type {
  SimpanAktifitasInput, SimpanKegiatanInput, SimpanProgramInput, SimpanSubkegiatanInput,
} from "@/services"
import type { BarisMaster, IdTingkat } from "./tingkat"
import { TINGKAT } from "./tingkat"

const teks = (pesan: string) => z.string().trim().min(1, pesan)
const titleCase = (nilai: string) => nilai
  .toLocaleLowerCase("id-ID")
  .replace(/(^|[\s-])\S/g, (huruf) => huruf.toLocaleUpperCase("id-ID"))

const SKEMA = {
  program: z.object({
    kodeProgram: teks("Kode program wajib diisi."),
    namaProgram: teks("Nama program wajib diisi."),
  }),
  kegiatan: z.object({
    kodeKegiatan: teks("Kode kegiatan wajib diisi."),
    namaKegiatan: teks("Nama kegiatan wajib diisi."),
  }),
  subkegiatan: z.object({
    kodeIndikatorUtama: teks("Kode subkegiatan wajib diisi."),
    namaIndikatorUtama: teks("Nama subkegiatan wajib diisi."),
    indikatorKinerja: teks("Indikator kinerja wajib diisi — ini yang dihitung."),
    targetKinerja: z.coerce.number().min(0, "Target tidak boleh negatif."),
    satuanKinerja: teks("Satuan wajib diisi."),
    outputKinerja: z.string().trim().optional(),
  }),
  aktifitas: z.object({
    kodeIndikator: teks("Kode aktifitas wajib diisi."),
    namaIndikator: teks("Nama aktifitas wajib diisi."),
    tipeAktifitas: z.enum(["UTAMA", "PENDUKUNG"]),
    satuan: teks("Satuan wajib diisi."),
    targetAnjuran: z.coerce.number().min(0, "Target tidak boleh negatif."),
  }),
} as const

type NilaiForm = Record<string, unknown>

function tambahNomorTerakhir(kode: string): string {
  const cocok = kode.match(/(\d+)(?!.*\d)/)
  if (!cocok || cocok.index == null) return `${kode}.1`
  const angka = String(Number(cocok[1]) + 1).padStart(cocok[1].length, "0")
  return `${kode.slice(0, cocok.index)}${angka}${kode.slice(cocok.index + cocok[1].length)}`
}

function kodeBerikutnya(kode: string[], fallback: string): string {
  if (!kode.length) return fallback
  return tambahNomorTerakhir([...kode].sort((a, b) => a.localeCompare(b, "id", { numeric: true })).at(-1)!)
}

function nilaiAwal(tingkat: IdTingkat, baris: BarisMaster | null): NilaiForm {
  if (!baris) {
    if (tingkat === "aktifitas")
      return { kodeIndikator: "", namaIndikator: "", tipeAktifitas: "PENDUKUNG", satuan: "", targetAnjuran: 1 }
    if (tingkat === "subkegiatan")
      return { kodeIndikatorUtama: "", namaIndikatorUtama: "", indikatorKinerja: "", targetKinerja: 1, satuanKinerja: "", outputKinerja: "" }
    if (tingkat === "kegiatan") return { kodeKegiatan: "", namaKegiatan: "" }
    return { kodeProgram: "", namaProgram: "" }
  }
  const { id: _id, flagActive: _f, bobotTarget: _b, ...sisa } =
    baris as unknown as Record<string, unknown> & { id: number; flagActive: boolean; bobotTarget?: number }
  return { ...sisa, outputKinerja: (sisa.outputKinerja as string) ?? "" }
}

export function LaciMaster({
  tingkat,
  baris,
  indukId,
  jumlahPendukungAktif,
  terbuka,
  onTutup,
  onTersimpan,
}: {
  tingkat: IdTingkat
  /** null = tambah baru */
  baris: BarisMaster | null
  indukId: number | null
  /** Untuk pratinjau 30%÷n saat menambah pendukung baru. */
  jumlahPendukungAktif: number
  terbuka: boolean
  onTutup: () => void
  onTersimpan: () => void
}) {
  const def = TINGKAT[tingkat]
  const [galat, setGalat] = React.useState<string | null>(null)

  // Backend OPERA menempatkan program pada satu dokumen perencanaan.
  // Konsep "urusan" hanya ada di mock lama dan belum menjadi resource API.
  const [dokumens, setDokumens] = React.useState<Dokumen[]>([])
  const [dokumenId, setDokumenId] = React.useState<number | null>(null)
  const kodeTerisiOtomatis = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (tingkat !== "program") return
    getDokumen().then((d) => {
      setDokumens(d)
      const asal = baris as { dokumenId?: number } | null
      setDokumenId(asal?.dokumenId ?? d[0]?.id ?? null)
    })
  }, [tingkat, baris])

  const form = useForm<NilaiForm>({
    resolver: zodResolver(SKEMA[tingkat] as never),
    values: nilaiAwal(tingkat, baris),
  })
  const errors = form.formState.errors as FieldErrors<Record<string, unknown>>
  const e = (n: string) => (errors[n] ? [errors[n] as { message?: string }] : undefined)

  const tipe = form.watch("tipeAktifitas")

  // Prefill hanya untuk baris baru. Nilainya tetap input biasa dan langsung
  // dapat diedit; perubahan pilihan tipe aktifitas memperbarui saran selama
  // pengguna belum mengganti kode tersebut sendiri.
  React.useEffect(() => {
    if (!terbuka || baris) return
    let batal = false
    const isi = (field: string, kode: string) => {
      if (batal) return
      const sekarang = String(form.getValues(field) ?? "")
      if (!sekarang || sekarang === kodeTerisiOtomatis.current) {
        form.setValue(field, kode, { shouldDirty: false })
        kodeTerisiOtomatis.current = kode
      }
    }

    if (tingkat === "program") {
      void getProgram({ termasukNonaktif: true }).then(rows => {
        const saudara = rows.filter(r => r.dokumenId === dokumenId).map(r => r.kodeProgram)
        isi("kodeProgram", kodeBerikutnya(saudara, "1.01.01"))
      })
    } else if (indukId != null && tingkat === "kegiatan") {
      void Promise.all([getProgramById(indukId), getKegiatanByProgram(indukId, { termasukNonaktif: true })]).then(([induk, rows]) =>
        isi("kodeKegiatan", kodeBerikutnya(rows.map(r => r.kodeKegiatan), `${induk?.kodeProgram ?? "1"}.01`))
      )
    } else if (indukId != null && tingkat === "subkegiatan") {
      void Promise.all([getKegiatanById(indukId), getSubkegiatanByKegiatan(indukId, { termasukNonaktif: true })]).then(([induk, rows]) =>
        isi("kodeIndikatorUtama", kodeBerikutnya(rows.map(r => r.kodeIndikatorUtama), `${induk?.kodeKegiatan ?? "1.01"}.1`))
      )
    } else if (indukId != null && tingkat === "aktifitas") {
      void Promise.all([getSubkegiatanById(indukId), getAktifitasByIndikatorUtama(indukId, { termasukNonaktif: true })]).then(([induk, rows]) => {
        const awalan = rows[0]?.kodeIndikator.split(/-(?:U|P)\d+$/)[0] ?? induk?.kodeIndikatorUtama ?? "AKT"
        const tipeAktif = tipe === "UTAMA" ? "U" : "P"
        const sejenis = rows.filter(r => r.tipeAktifitas === tipe).map(r => r.kodeIndikator)
        const nomor = sejenis.length
          ? (Math.max(...sejenis.map(k => Number(k.match(/\d+$/)?.[0] ?? 0))) + 1)
          : 1
        isi("kodeIndikator", `${awalan}-${tipeAktif}${nomor}`)
      })
    }
    return () => { batal = true }
  }, [baris, dokumenId, form, indukId, terbuka, tingkat, tipe])

  async function kirim(nilai: NilaiForm) {
    setGalat(null)
    try {
      if (tingkat === "program") {
        await simpanProgram({
          ...(nilai as unknown as SimpanProgramInput),
          id: baris?.id,
          dokumenId: dokumenId!,
          // Dipertahankan di tipe UI lama; backend tidak menggunakan nilainya.
          urusanId: 0,
        })
      } else if (tingkat === "kegiatan") {
        await simpanKegiatan({
          ...(nilai as unknown as SimpanKegiatanInput),
          id: baris?.id,
          programId: indukId!,
        })
      } else if (tingkat === "subkegiatan") {
        const v = nilai as unknown as SimpanSubkegiatanInput
        await simpanSubkegiatan({
          ...v, id: baris?.id, kegiatanId: indukId!,
          outputKinerja: v.outputKinerja || null,
        })
      } else {
        await simpanAktifitas({
          ...(nilai as unknown as SimpanAktifitasInput),
          id: baris?.id,
          indikatorUtamaId: indukId!,
        })
      }
      onTersimpan()
      onTutup()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal menyimpan.")
    }
  }

  return (
    <Sheet open={terbuka} onOpenChange={(o) => !o && onTutup()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <Eyebrow>{baris ? "Ubah" : "Tambah"} · {def.tingkat}</Eyebrow>
          <SheetTitle className="font-bold">
            {baris ? `Ubah ${def.label.toLowerCase()}` : `${def.label} baru`}
          </SheetTitle>
          <SheetDescription>
            Bobot tidak pernah diisi manual — ia dihitung dari jumlah aktifitas pendukung yang aktif.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(kirim)}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {tingkat === "program" && (
              <>
                <Field>
                  <FieldLabel htmlFor="dokumenId">Dokumen perencanaan</FieldLabel>
                  <select
                    id="dokumenId"
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    value={dokumenId ?? ""}
                    onChange={(e) => setDokumenId(Number(e.target.value))}
                  >
                    {dokumens.map((d) => (
                      <option key={d.id} value={d.id}>{d.nama}</option>
                    ))}
                  </select>
                  <FieldDescription>
                    Kode program hanya perlu unik di dalam dokumen ini.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="kodeProgram">Kode program</FieldLabel>
                  <Input id="kodeProgram" className="font-mono" placeholder="5.1.2" {...form.register("kodeProgram")} />
                  <FieldError errors={e("kodeProgram")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="namaProgram">Nama program</FieldLabel>
                  <Textarea
                    id="namaProgram"
                    rows={3}
                    {...form.register("namaProgram")}
                    onChange={(event) => {
                      const nilai = event.target.value.toUpperCase()
                      event.target.value = nilai
                      form.setValue("namaProgram", nilai, { shouldDirty: true, shouldValidate: true })
                    }}
                  />
                  <FieldError errors={e("namaProgram")} />
                </Field>
              </>
            )}

            {tingkat === "kegiatan" && (
              <>
                <Field>
                  <FieldLabel htmlFor="kodeKegiatan">Kode kegiatan</FieldLabel>
                  <Input id="kodeKegiatan" className="font-mono" placeholder="5.1.2.2.01" {...form.register("kodeKegiatan")} />
                  <FieldError errors={e("kodeKegiatan")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="namaKegiatan">Nama kegiatan</FieldLabel>
                  <Textarea
                    id="namaKegiatan"
                    rows={3}
                    {...form.register("namaKegiatan")}
                    onChange={(event) => {
                      const nilai = titleCase(event.target.value)
                      event.target.value = nilai
                      form.setValue("namaKegiatan", nilai, { shouldDirty: true, shouldValidate: true })
                    }}
                  />
                  <FieldError errors={e("namaKegiatan")} />
                </Field>
              </>
            )}

            {tingkat === "subkegiatan" && (
              <>
                <Field>
                  <FieldLabel htmlFor="kodeIndikatorUtama">Kode subkegiatan</FieldLabel>
                  <Input id="kodeIndikatorUtama" className="font-mono" placeholder="5.1.2.2.01.1" {...form.register("kodeIndikatorUtama")} />
                  <FieldError errors={e("kodeIndikatorUtama")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="namaIndikatorUtama">Nama subkegiatan</FieldLabel>
                  <Textarea
                    id="namaIndikatorUtama"
                    rows={3}
                    {...form.register("namaIndikatorUtama")}
                    onChange={(event) => {
                      const nilai = titleCase(event.target.value)
                      event.target.value = nilai
                      form.setValue("namaIndikatorUtama", nilai, { shouldDirty: true, shouldValidate: true })
                    }}
                  />
                  <FieldError errors={e("namaIndikatorUtama")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="indikatorKinerja">Indikator kinerja</FieldLabel>
                  <Input id="indikatorKinerja" {...form.register("indikatorKinerja")} />
                  <FieldDescription>Apa yang dihitung, mis. “Jumlah dokumen tersusun”.</FieldDescription>
                  <FieldError errors={e("indikatorKinerja")} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="targetKinerja">Target</FieldLabel>
                    <Input id="targetKinerja" type="number" step="any" className="tabular font-mono" {...form.register("targetKinerja")} />
                    <FieldError errors={e("targetKinerja")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="satuanKinerja">Satuan</FieldLabel>
                    <Input id="satuanKinerja" placeholder="dokumen" {...form.register("satuanKinerja")} />
                    <FieldError errors={e("satuanKinerja")} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="outputKinerja">Output kinerja</FieldLabel>
                  <Input id="outputKinerja" {...form.register("outputKinerja")} />
                  <FieldDescription>Boleh dikosongkan.</FieldDescription>
                </Field>
              </>
            )}

            {tingkat === "aktifitas" && (
              <>
                <Field>
                  <FieldLabel htmlFor="kodeIndikator">Kode aktifitas</FieldLabel>
                  <Input id="kodeIndikator" className="font-mono" {...form.register("kodeIndikator")} />
                  <FieldError errors={e("kodeIndikator")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="namaIndikator">Nama aktifitas</FieldLabel>
                  <Textarea
                    id="namaIndikator"
                    rows={3}
                    {...form.register("namaIndikator")}
                    onChange={(event) => {
                      const nilai = titleCase(event.target.value)
                      event.target.value = nilai
                      form.setValue("namaIndikator", nilai, { shouldDirty: true, shouldValidate: true })
                    }}
                  />
                  <FieldError errors={e("namaIndikator")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tipeAktifitas">Tipe</FieldLabel>
                  <select
                    id="tipeAktifitas"
                    className="h-8 rounded-md border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    {...form.register("tipeAktifitas")}
                  >
                    <option value="PENDUKUNG">Pendukung — berbagi 30%</option>
                    <option value="UTAMA">Utama — 70%, satu per subkegiatan</option>
                  </select>
                  <FieldError errors={e("tipeAktifitas")} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="targetAnjuran">Target anjuran</FieldLabel>
                    <Input id="targetAnjuran" type="number" step="any" className="tabular font-mono" {...form.register("targetAnjuran")} />
                    <FieldError errors={e("targetAnjuran")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="satuan">Satuan</FieldLabel>
                    <Input id="satuan" placeholder="kegiatan" {...form.register("satuan")} />
                    <FieldError errors={e("satuan")} />
                  </Field>
                </div>

                {tipe === "PENDUKUNG" && !baris && (
                  <div className="space-y-2">
                    <Eyebrow>Akibat menambah baris ini</Eyebrow>
                    <LedgerTambahPendukung jumlahSekarang={jumlahPendukungAktif} />
                  </div>
                )}
              </>
            )}

            {galat && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>
            )}
          </div>

          <SheetFooter className="border-t">
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                (tingkat === "program" && dokumenId == null)
              }
            >
              {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" onClick={onTutup}>
              Batal
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
