export type FilterStatusAktivitas = "belum" | "semua" | "selesai"
export type FilterJenisAktivitas = "semua" | "utama" | "pendukung"

type AktivitasDapatDisaring = {
  selesai: boolean
  tipeAktifitas: "UTAMA" | "PENDUKUNG"
}

type AktivitasDapatDicari = {
  kodeSubkegiatan: string
  namaSubkegiatan: string
  namaAktifitas: string
}

export function cariAktivitasRealisasi<T extends AktivitasDapatDicari>(
  daftar: T[],
  kataKunci: string,
) {
  const kata = kataKunci.trim().toLocaleLowerCase("id-ID")
  if (!kata) return daftar

  return daftar.filter((aktivitas) =>
    [
      aktivitas.kodeSubkegiatan,
      aktivitas.namaSubkegiatan,
      aktivitas.namaAktifitas,
    ].some((nilai) => nilai.toLocaleLowerCase("id-ID").includes(kata))
  )
}

export function saringAktivitasRealisasi<T extends AktivitasDapatDisaring>(
  daftar: T[],
  status: FilterStatusAktivitas,
  jenis: FilterJenisAktivitas,
) {
  return daftar.filter((aktivitas) => {
    const cocokJenis = jenis === "semua"
      || (jenis === "utama" && aktivitas.tipeAktifitas === "UTAMA")
      || (jenis === "pendukung" && aktivitas.tipeAktifitas === "PENDUKUNG")
    const cocokStatus = status === "semua"
      || (status === "selesai" && aktivitas.selesai)
      || (status === "belum" && !aktivitas.selesai)

    return cocokJenis && cocokStatus
  })
}

export function hitungStatusAktivitas<T extends AktivitasDapatDisaring>(
  daftar: T[],
  jenis: FilterJenisAktivitas,
) {
  const sesuaiJenis = saringAktivitasRealisasi(daftar, "semua", jenis)

  return {
    belum: sesuaiJenis.filter((aktivitas) => !aktivitas.selesai).length,
    semua: sesuaiJenis.length,
    selesai: sesuaiJenis.filter((aktivitas) => aktivitas.selesai).length,
  }
}
