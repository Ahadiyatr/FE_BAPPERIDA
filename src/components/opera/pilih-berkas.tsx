import * as React from "react"
import { FileText, Paperclip, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Identitas berkas untuk membuang duplikat saat memilih lagi. */
const kunciBerkas = (f: File) => `${f.name}|${f.size}|${f.lastModified}`

const ukuran = (byte: number) =>
  byte < 1024
    ? `${byte} B`
    : byte < 1024 * 1024
      ? `${(byte / 1024).toLocaleString("id-ID", { maximumFractionDigits: 0 })} KB`
      : `${(byte / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`

function Pratinjau({ berkas }: { berkas: File }) {
  const gambar = berkas.type.startsWith("image/")
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    // jsdom tidak punya createObjectURL; tanpa pratinjau ikon dokumen tetap tampil.
    if (!gambar || typeof URL.createObjectURL !== "function") return
    const u = URL.createObjectURL(berkas)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [berkas, gambar])

  return url ? (
    <img src={url} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
  ) : (
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
      <FileText className="size-4" />
    </span>
  )
}

/**
 * Pemilih berkas yang menampilkan pilihannya.
 *
 * Input file bawaan hanya menulis "2 files" dan tidak bisa membatalkan satu berkas;
 * memilih lagi juga menimpa pilihan sebelumnya. Di sini pilihan ditambahkan
 * (duplikat dibuang) dan setiap berkas bisa dilepas sendiri.
 */
export function PilihBerkas({
  nilai,
  onUbah,
  accept,
  label = "Pilih berkas",
  className,
}: {
  nilai: File[]
  onUbah: (berkas: File[]) => void
  accept?: string
  label?: string
  className?: string
}) {
  const input = React.useRef<HTMLInputElement>(null)

  function tambah(daftar: FileList | null) {
    const baru = Array.from(daftar ?? [])
    const ada = new Set(nilai.map(kunciBerkas))
    onUbah([...nilai, ...baru.filter((f) => !ada.has(kunciBerkas(f)))])
    // Kosongkan supaya berkas yang sama bisa dipilih lagi setelah dilepas.
    if (input.current) input.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="pilih-berkas-input"
        onChange={(e) => tambah(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          <Paperclip className="size-3.5" />
          {nilai.length ? "Tambah berkas" : label}
        </Button>
        <span className="text-xs text-slate-500">
          {nilai.length ? `${nilai.length} berkas dipilih` : "Belum ada berkas dipilih"}
        </span>
        {nilai.length > 1 && (
          <button
            type="button"
            className="ml-auto text-xs font-semibold text-slate-500 hover:text-red-600"
            onClick={() => onUbah([])}
          >
            Lepas semua
          </button>
        )}
      </div>

      {nilai.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {nilai.map((f) => (
            <li key={kunciBerkas(f)} className="flex items-center gap-2.5 px-2.5 py-2">
              <Pratinjau berkas={f} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={f.name}>{f.name}</p>
                <p className="text-xs text-slate-500">
                  {f.type.startsWith("image/") ? "Foto" : "Dokumen"} · {ukuran(f.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-slate-400 hover:text-red-600"
                aria-label={`Lepas ${f.name}`}
                onClick={() => onUbah(nilai.filter((x) => x !== f))}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
