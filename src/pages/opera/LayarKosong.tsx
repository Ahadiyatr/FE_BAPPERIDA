import { Card, CardContent } from "@/components/ui/card"

/** Cangkang layar Fase 0. Tiap rute sudah punya berkas dan judulnya sendiri
 * supaya Fase 1-5 tinggal mengisi badannya, bukan membuat rutenya dulu. */
export function LayarKosong({
  judul,
  ringkas,
  fase,
}: {
  judul: string
  ringkas: string
  fase: string
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{judul}</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-500">{ringkas}</p>
      </div>
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <span className="rounded-xl bg-amber-50 px-2 py-1 font-mono text-[11px] tracking-[0.12em] uppercase text-amber-600">
            Belum diisi
          </span>
          <p className="text-sm text-muted-foreground">
            Layar ini dikerjakan di <b className="text-foreground">{fase}</b>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
