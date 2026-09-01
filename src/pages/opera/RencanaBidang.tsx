import * as React from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Check, Plus, TriangleAlert, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BobotMeter } from "@/components/opera/bobot-meter"
import { Eyebrow, Kode } from "@/components/opera/primitives"
import {
  cabutSubkegiatanDariRencana, getKatalogTersedia, getPeriode, getRencanaBidang,
  hapusAktifitasDariRencana, periksaKesiapan, tambahAktifitasKeRencana,
  tambahSubkegiatanKeRencana, tandaiKesiapan, ubahTargetAktifitas, ubahTargetSubkegiatan,
} from "@/services"
import type {
  BarisRencana, HasilPemeriksaan, KatalogTersedia, RencanaBidangDetail,
} from "@/services"
import { cn } from "@/lib/utils"

const persen = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

/* ── kolom 3: pemeriksaan ──────────────────────────────────── */

function PanelPemeriksaan({
  hasil, baris, status, statusPeriode, onPilih, onTandai, sedangMenandai,
}: {
  hasil: HasilPemeriksaan | null
  baris: BarisRencana[]
  status: "DRAFT" | "SIAP"
  statusPeriode: "DRAFT" | "OPEN" | "LOCKED"
  onPilih: (id: number) => void
  onTandai: (s: "DRAFT" | "SIAP") => void
  sedangMenandai: boolean
}) {
  const IKON = { ok: Check, warn: TriangleAlert, bad: X }
  const NADA = {
    ok: "bg-slate-100 text-slate-600",
    warn: "bg-amber-50 text-amber-600",
    bad: "bg-red-50 text-red-600",
  }

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b px-3 py-2">
        <h3 className="font-bold text-[13px] font-bold">Pemeriksaan</h3>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {!hasil && <Skeleton className="h-16" />}
          {hasil?.butir.map((b, i) => {
            const Ikon = IKON[b.nada]
            const terkait = baris.find((r) => b.rincian.startsWith(`${r.kodeSubkegiatan}:`))
            const isi = (
              <>
                <Ikon className="mt-0.5 size-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <b className="block">{terkait ? terkait.kodeSubkegiatan : b.judul}</b>
                  {terkait && <span className="mb-1 block line-clamp-2 font-medium text-foreground/80">{terkait.namaSubkegiatan}</span>}
                  <span className="opacity-80">
                    {terkait ? b.rincian.slice(terkait.kodeSubkegiatan.length + 1).trim() : b.rincian}
                  </span>
                  {terkait && <span className="mt-1 block font-semibold underline underline-offset-2">Buka subkegiatan →</span>}
                </div>
              </>
            )
            return (
              terkait ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPilih(terkait.subkegiatanBidang.id)}
                  className={cn("flex w-full gap-2 rounded-xl p-2.5 text-left text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", NADA[b.nada])}
                >
                  {isi}
                </button>
              ) : (
                <div key={i} className={cn("flex gap-2 rounded-xl p-2.5 text-xs", NADA[b.nada])}>{isi}</div>
              )
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {statusPeriode !== "DRAFT" ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Periode sudah {statusPeriode === "OPEN" ? "dibuka" : "terkunci"}. Tahap kesiapan sudah berakhir dan rencana tidak dapat diubah.
          </p>
        ) : status === "SIAP" ? (
          <Button variant="outline" className="w-full" onClick={() => onTandai("DRAFT")} disabled={sedangMenandai}>
            Buka kembali sebagai draf
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!hasil?.bolehTandaiSiap || sedangMenandai}
            onClick={() => onTandai("SIAP")}
          >
            {hasil?.bolehTandaiSiap
              ? "Tandai bidang ini siap"
              : `Lengkapi ${hasil?.jumlahMenghalangi ?? 0} subkegiatan dulu`}
          </Button>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Setelah ditandai siap, admin bidang bisa melihat rencananya tetapi belum bisa
          mencatat realisasi.
        </p>
      </div>
    </div>
  )
}

/* ── kolom 2: editor satu subkegiatan ──────────────────────── */

function Editor({
  baris, dapatDisunting, onBerubah, onGalat,
}: {
  baris: BarisRencana
  dapatDisunting: boolean
  onBerubah: () => Promise<void>
  onGalat: (p: string) => void
}) {
  const skb = baris.subkegiatanBidang
  const [target, setTarget] = React.useState(String(skb.target))
  const [namaBaru, setNamaBaru] = React.useState("")
  const [targetBaru, setTargetBaru] = React.useState("1")

  React.useEffect(() => { setTarget(String(skb.target)) }, [skb.id, skb.target])

  const utama = baris.aktifitas.find((a) => a.tipeAktifitas === "UTAMA")
  const pendukung = baris.aktifitas.filter((a) => a.tipeAktifitas === "PENDUKUNG")
  const total = baris.aktifitas.reduce((a, x) => a + x.bobotTarget, 0)

  async function bungkus(f: () => Promise<unknown>) {
    try { await f(); await onBerubah() }
    catch (e) { onGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <Kode>{baris.kodeSubkegiatan}</Kode>
        <h3 className="font-bold text-base leading-snug font-bold">{baris.namaSubkegiatan}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Eyebrow>Indikator kinerja</Eyebrow>
          <p className="text-sm">{skb.indikatorKinerja || <em className="text-red-600">belum diisi</em>}</p>
        </div>
        <div className="space-y-1.5">
          <Eyebrow>Target · {skb.satuan}</Eyebrow>
          <Input
            type="number" step="any" min={0}
            className="tabular h-8 w-32 font-mono"
            value={target}
            disabled={!dapatDisunting}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={() => {
              const n = Number(target)
              if (Number.isFinite(n) && n !== skb.target) void bungkus(() => ubahTargetSubkegiatan(skb.id, n))
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <Eyebrow>Pembagian bobot</Eyebrow>
          <span className="tabular ml-auto font-mono text-xs text-muted-foreground">
            Σ {persen(total)}
          </span>
        </div>
        {utama ? (
          <BobotMeter
            utama={{ nama: utama.namaAktifitas, target: utama.target, realisasi: utama.realisasi, bobotTarget: utama.bobotTarget }}
            pendukung={pendukung.map((a) => ({
              nama: a.namaAktifitas, target: a.target, realisasi: a.realisasi, bobotTarget: a.bobotTarget,
            }))}
          />
        ) : (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            Belum ada aktivitas utama — tidak ada pemegang bobot 70%.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Eyebrow>Aktivitas ({baris.aktifitas.length})</Eyebrow>
        <div className="divide-y rounded-xl border">
          {baris.aktifitas.map((a) => (
            <div key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span
                className={cn(
                  "shrink-0 rounded-xl px-1.5 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase",
                  a.tipeAktifitas === "UTAMA" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                )}
              >
                {a.tipeAktifitas === "UTAMA" ? "Utama" : "Pendukung"}
              </span>
              <span className="min-w-0 flex-1 truncate">{a.namaAktifitas}</span>
              <Input
                type="number" step="any" min={0}
                className="tabular h-7 w-20 font-mono"
                defaultValue={a.target}
                disabled={!dapatDisunting}
                onBlur={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n) && n !== a.target) void bungkus(() => ubahTargetAktifitas(a.id, n))
                }}
              />
              <span className="tabular w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                {persen(a.bobotTarget)}
              </span>
              {dapatDisunting && a.flagAdhoc && a.tipeAktifitas === "PENDUKUNG" && (
                <Button
                  variant="ghost" size="icon-xs"
                  title="Hapus aktivitas ad-hoc"
                  onClick={() => void bungkus(() => hapusAktifitasDariRencana(a.id))}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {dapatDisunting ? (
      <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
        <Eyebrow>Tambah aktivitas pendukung</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-8 min-w-48 flex-1"
            placeholder="Nama aktivitas pendukung"
            value={namaBaru}
            onChange={(e) => setNamaBaru(e.target.value)}
          />
          <Input
            type="number" step="any" min={0}
            className="tabular h-8 w-20 font-mono"
            value={targetBaru}
            onChange={(e) => setTargetBaru(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!namaBaru.trim()}
            onClick={() =>
              void bungkus(async () => {
                await tambahAktifitasKeRencana({
                  subkegiatanBidangId: skb.id,
                  namaAktifitas: namaBaru,
                  target: Number(targetBaru) || 0,
                })
                setNamaBaru("")
              })
            }
          >
            <Plus className="size-3.5" /> Tambah
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Menambah baris ini membagi 30% ke <b>{pendukung.length + 1}</b> aktivitas pendukung —
          dari {persen(pendukung.length ? 30 / pendukung.length : 0)} menjadi{" "}
          {persen(30 / (pendukung.length + 1))} tiap satu.
        </p>
      </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Rencana hanya dapat diubah saat periode berstatus DRAFT.
        </p>
      )}
    </div>
  )
}

/* ── layar ─────────────────────────────────────────────────── */

export default function RencanaBidang() {
  const { bidangId } = useParams()
  const [sp] = useSearchParams()
  const idBidang = Number(bidangId)

  const [periodeId, setPeriodeId] = React.useState<number | null>(
    sp.get("periode") ? Number(sp.get("periode")) : null
  )
  const [rencana, setRencana] = React.useState<RencanaBidangDetail | null>(null)
  const [tidakAda, setTidakAda] = React.useState(false)
  const [hasil, setHasil] = React.useState<HasilPemeriksaan | null>(null)
  const [pilih, setPilih] = React.useState<number | null>(null)
  const [katalog, setKatalog] = React.useState<KatalogTersedia[]>([])
  const [katalogTerbuka, setKatalogTerbuka] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [menandai, setMenandai] = React.useState(false)

  React.useEffect(() => {
    if (periodeId != null) return
    getPeriode()
      .then((p) => setPeriodeId((p.find((x) => x.status === "DRAFT") ?? p[0])?.id ?? null))
      .catch(() => setGalat("Gagal memuat periode."))
  }, [periodeId])

  const muat = React.useCallback(async () => {
    if (periodeId == null || !Number.isFinite(idBidang)) return
    try {
      const [r, h, k] = await Promise.all([
        getRencanaBidang(idBidang, periodeId),
        periksaKesiapan(idBidang, periodeId),
        getKatalogTersedia(periodeId),
      ])
      setTidakAda(r === null)
      setRencana(r)
      setHasil(h)
      setKatalog(k)
      setPilih((p) => (r?.baris.some((b) => b.subkegiatanBidang.id === p) ? p : r?.baris[0]?.subkegiatanBidang.id ?? null))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal memuat rencana.")
    }
  }, [idBidang, periodeId])

  React.useEffect(() => { void muat() }, [muat])

  const terpilih = rencana?.baris.find((b) => b.subkegiatanBidang.id === pilih) ?? null
  const dapatDisunting = rencana?.periode.status === "DRAFT"
  const kodeBermasalah = React.useMemo(
    () => new Set((hasil?.butir ?? []).map((butir) => butir.rincian.split(":", 1)[0])),
    [hasil]
  )

  React.useEffect(() => {
    if (pilih == null) return
    document.querySelector(`[data-rencana-id="${pilih}"]`)?.scrollIntoView({ block: "nearest" })
  }, [pilih])

  async function tandai(s: "DRAFT" | "SIAP") {
    if (periodeId == null) return
    setMenandai(true)
    try { await tandaiKesiapan(idBidang, periodeId, s); await muat() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menandai.") }
    finally { setMenandai(false) }
  }

  async function bungkus(f: () => Promise<unknown>) {
    setGalat(null)
    try { await f(); await muat() }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan.") }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/rencana"><ArrowLeft className="size-3.5" /> Papan kesiapan</Link>
        </Button>
        <div className="min-w-0">
          <Eyebrow>Menyusun rencana{rencana ? ` · ${rencana.periode.namaPeriode}` : ""}</Eyebrow>
          <h2 className="truncate font-bold text-base font-extrabold">
            {rencana ? `Bidang ${rencana.bidang.namaBidang}` : tidakAda ? "Tidak ditemukan" : "Memuat…"}
          </h2>
        </div>
        {rencana && (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "rounded-xl px-2 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase",
              rencana.periode.status === "DRAFT" ? "bg-emerald-50 text-emerald-700" : rencana.periode.status === "OPEN" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
            )}>
              Periode {rencana.periode.status}
            </span>
            <span className={cn(
              "rounded-xl px-2 py-0.5 font-mono text-[11px] tracking-[0.12em] uppercase",
              rencana.status === "SIAP" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"
            )}>
              Kesiapan {rencana.status}
            </span>
          </div>
        )}

          <Popover open={katalogTerbuka} onOpenChange={setKatalogTerbuka}>
            <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto" disabled={!katalog.length || !dapatDisunting}>
              <Plus className="size-3.5" /> Tambah subkegiatan
              <span className="font-mono text-[11px] tracking-[0.12em] opacity-60">{katalog.length}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[26rem] p-0" align="end">
            <Command>
              <CommandInput placeholder="Cari subkegiatan di katalog…" />
              <CommandList>
                <CommandEmpty>Tidak ada subkegiatan yang cocok.</CommandEmpty>
                <CommandGroup heading="Belum dipegang bidang mana pun">
                  {katalog.map((k) => (
                    <CommandItem
                      key={k.indikatorUtamaId}
                      value={`${k.kode} ${k.nama}`}
                      onSelect={() => {
                        setKatalogTerbuka(false)
                        void bungkus(() =>
                          tambahSubkegiatanKeRencana({
                            indikatorUtamaId: k.indikatorUtamaId,
                            bidangId: idBidang,
                            periodeId: periodeId!,
                          })
                        )
                      }}
                    >
                      <div className="min-w-0">
                        <Kode>{k.kode}</Kode>
                        <span className="line-clamp-2 text-sm">{k.nama}</span>
                        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
                          {k.jumlahAktifitas} aktivitas
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {galat && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{galat}</p>}

      {tidakAda && (
        <div className="rounded-xl border bg-card px-4 py-6 text-sm shadow-sm">
          <b className="block font-bold">Bidang atau periode tidak ditemukan.</b>
          <span className="text-muted-foreground">
            Kembali ke papan kesiapan dan pilih salah satu bidang di sana.
          </span>
        </div>
      )}

      {!tidakAda && (
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_1fr_18rem]">
        {/* navigator */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <h3 className="font-bold text-[13px] font-bold">Subkegiatan bidang ini</h3>
            <span className="tabular ml-auto rounded-xl bg-muted px-1.5 font-mono text-[11px] tracking-[0.12em]">
              {rencana?.baris.length ?? 0}
            </span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-1.5">
              {!rencana && <Skeleton className="h-24" />}
              {rencana?.baris.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground">
                  Belum ada subkegiatan. Tambahkan dari katalog.
                </p>
              )}
              {rencana?.baris.map((b) => {
                const kurang = kodeBermasalah.has(b.kodeSubkegiatan)
                return (
                  <button
                    key={b.subkegiatanBidang.id}
                    data-rencana-id={b.subkegiatanBidang.id}
                    type="button"
                    onClick={() => setPilih(b.subkegiatanBidang.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-xl px-2.5 py-2 text-left text-xs",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      b.subkegiatanBidang.id === pilih ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Kode className={b.subkegiatanBidang.id === pilih ? "text-primary-foreground/60" : undefined}>
                        {b.kodeSubkegiatan}
                      </Kode>
                      {kurang && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" title="Belum lengkap" />}
                    </span>
                    <span className="line-clamp-2">{b.namaSubkegiatan}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* editor */}
        <div className="min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!rencana && <div className="p-4"><Skeleton className="h-40" /></div>}
          {rencana && !terpilih && (
            <p className="p-6 text-sm text-muted-foreground">
              Pilih satu subkegiatan di kolom kiri untuk menyunting targetnya.
            </p>
          )}
          {terpilih && (
            <>
              <Editor baris={terpilih} dapatDisunting={dapatDisunting} onBerubah={muat} onGalat={setGalat} />
              {dapatDisunting && <div className="border-t px-4 py-3">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => void bungkus(() => cabutSubkegiatanDariRencana(terpilih.subkegiatanBidang.id))}
                >
                  Cabut subkegiatan ini dari bidang
                </Button>
              </div>}
            </>
          )}
        </div>

        <PanelPemeriksaan
          hasil={hasil}
          baris={rencana?.baris ?? []}
          status={rencana?.status ?? "DRAFT"}
          statusPeriode={rencana?.periode.status ?? "DRAFT"}
          onPilih={setPilih}
          onTandai={(s) => void tandai(s)}
          sedangMenandai={menandai}
        />
      </div>
      )}
    </div>
  )
}
