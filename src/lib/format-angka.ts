/**
 * Persentase satu desimal berformat Indonesia ("75,8%"). Dipakai bersama layar admin dan
 * halaman publik supaya angka yang sama tidak tampil berbeda di dua tempat (P3-R04).
 *
 * Aturannya: setiap capaian dan bobot yang tampil memakai `persen1`. Jangan menulis ulang
 * dengan `toFixed(1)` — `toFixed` membulatkan nilai biner (1,45 → "1,4"), sedangkan Intl
 * membulatkan setengah ke atas (1,45 → "1,5"), dan nilai backend dua desimal sering jatuh
 * tepat di setengah.
 */
export const persen1 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

/**
 * Persentase dua desimal, khusus untuk rincian hitungan bobot di BobotLedger — supaya
 * penjumlahan barisnya bisa dicek tangan. Total capaian di bawahnya tetap `persen1`.
 */
export const persen2 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
