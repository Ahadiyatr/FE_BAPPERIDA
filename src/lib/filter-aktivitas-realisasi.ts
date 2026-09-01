export type FilterStatusAktivitas = "belum" | "semua" | "selesai"
export type FilterJenisAktivitas = "semua" | "utama" | "pendukung"

type AktivitasDapatDisaring = {
  selesai: boolean
  tipeAktifitas: "UTAMA" | "PENDUKUNG"
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
