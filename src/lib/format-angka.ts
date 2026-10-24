/**
 * Persentase satu desimal berformat Indonesia ("75,8%"). Dipakai bersama layar admin dan
 * halaman publik supaya angka yang sama tidak tampil berbeda di dua tempat (P3-R04).
 */
export const persen1 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
