# Refactor Frontend OPERA INK

Panduan memindahkan repo yang ada ke sistem desain baru. Referensi visualnya
di `docs/ui-reference/*.html` — buka di browser, jangan disalin kodenya
(itu HTML statis, bukan sumber kebenaran).

Stack yang diasumsikan: Vite + React + TypeScript, shadcn style `radix-nova`,
`rsc: false`, `cssVariables: true`, `baseColor: neutral`, ikon lucide.

---

## 1. Yang dipasang lebih dulu

```bash
# Font
npm i @fontsource/archivo @fontsource-variable/ibm-plex-sans @fontsource/ibm-plex-mono
```

```ts
// src/main.tsx — sebelum import index.css
import "@fontsource/archivo/600.css"
import "@fontsource/archivo/700.css"
import "@fontsource/archivo/800.css"
import "@fontsource-variable/ibm-plex-sans"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"
import "./index.css"
```

Komponen shadcn yang dibutuhkan seluruh aplikasi:

```bash
npx shadcn@latest add button card table badge input label select textarea \
  sheet dialog tooltip tabs separator scroll-area sidebar sonner \
  form checkbox switch dropdown-menu alert skeleton
```

Lalu timpa `src/index.css` dan gabungkan blok `extend` dari `tailwind.config.js`.

---

## 2. Peta pola mockup → komponen shadcn

| Pola di mockup | Pakai ini | Catatan |
|---|---|---|
| Rail navy kiri | `Sidebar` | Token `--sidebar-*` sudah navy, tidak perlu kelas manual |
| Topbar + breadcrumb | `SidebarTrigger` + prose biasa | Tidak perlu `Breadcrumb`, jalurnya cuma 2–3 tingkat |
| Kartu KPI (strip 4 angka) | `Card` + grid | Angka pakai `font-display text-3xl font-extrabold tabular` |
| Tabel master | `Table` | Header: `font-mono text-eyebrow uppercase` |
| Laci form kanan | `Sheet` (`side="right"`) | Untuk tambah/ubah data master |
| Modal konfirmasi & catat realisasi | `Dialog` | Bukan Sheet — tugasnya singkat |
| Lencana status | `StatusBadge` (opera) | Membungkus `Badge`, menambah nada teal/amber/brass |
| Meter bobot 70/30 | `BobotMeter` (opera) | **Jangan** pakai `Progress` |
| Buku besar bobot | `BobotLedger` (opera) | |
| Rantai 5 master | `ChainNav` (opera) | **Jangan** pakai `Tabs` |
| Akordion subkegiatan | `Collapsible` di dalam `Card` | |
| Papan kesiapan bidang | `Card` sebagai `<button>` | |
| Panel pemeriksaan kanan | `Alert` bervarian | |
| Notifikasi simpan | `sonner` | |
| Pilih induk / bidang | `Select` | Kalau opsi > 30, ganti `Command` + `Popover` |
| Unggah foto & dokumen | tulis sendiri | Tidak ada di shadcn |

Hanya empat yang ditulis dari nol: `BobotMeter`, `BobotLedger`, `ChainNav`,
dan pengunggah berkas. Sisanya shadcn yang di-restyle lewat token.

---

## 3. Aturan yang tidak boleh dilanggar

**Bobot tidak pernah jadi input.** Aktifitas utama menampilkan `70,0%` sebagai
field readonly. Aktifitas pendukung menampilkan `BobotLedger`, bukan kotak isian.
Kalau menemukan `<Input>` yang menerima bobot, itu bug.

**Nonaktifkan, bukan hapus.** Semua master punya `FLAG_ACTIVE`. Tidak ada
`AlertDialog` "Hapus permanen" untuk data master — menghapus master yang dipakai
periode lalu merusak arsip capaian.

**Radius 3px, bukan bawaan shadcn.** `--radius: 0.1875rem`. Sudut tajam disengaja:
ini instrumen perencanaan, bukan aplikasi konsumen.

**Ring fokus selalu brass.** `--ring` sudah brass; jangan timpa per komponen.

**Angka selalu `tabular`.** Kolom persen yang tidak sejajar bikin tabel capaian
sulit dipindai. Kelas `.tabular` tersedia global.

**Ambang warna dari satu tempat.** Pakai `nadaCapaian()` di `primitives.tsx`.
Jangan tulis `persen >= 90 ? ...` di komponen halaman.

---

## 4. Urutan refactor yang disarankan

Kerjakan berurutan; tiap langkah menghasilkan aplikasi yang tetap jalan.

1. **Token + font.** Timpa `index.css`, gabungkan `tailwind.config.js`, pasang
   font. Aplikasi lama langsung berubah rupa tanpa satu komponen pun disentuh —
   ini cara tercepat melihat apakah palet navy/brass cocok dengan layout yang ada.
2. **Primitif.** Salin `src/components/opera/`. Belum dipakai, tapi siap.
3. **Kerangka.** Ganti sidebar dan topbar ke `Sidebar` shadcn dengan token
   `--sidebar-*`.
4. **Satu layar percontohan.** Ambil layar tabel yang paling sederhana — biasanya
   Data Master → Program. Selesaikan sampai benar-benar rapi, jadikan cetakan.
5. **Sisa layar master**, mengikuti cetakan langkah 4.
6. **Layar penyusunan rencana** (3 kolom). Paling rumit, kerjakan setelah pola
   tabel dan laci form mantap.
7. **Dashboard dan pencatatan realisasi.**

---

## 5. Yang belum diputuskan — tanyakan sebelum mengoding

Empat hal ini memengaruhi bentuk komponen, bukan cuma isinya:

- **`MASTER_AKTIFITAS_UTAMA` dihapus atau dipertahankan?** Kalau dihapus, `ChainNav`
  jadi 4 mata rantai, bukan 5.
- **`MASTER_KEGIATAN` jadi ditambahkan?** Menentukan kedalaman rantai.
- **Bobot bidang manual atau rata-rata?** Menentukan apakah layar Master Bidang
  butuh kolom bobot per periode.
- **Boleh tambah aktifitas pendukung di tengah periode berjalan?** Kalau boleh,
  `BobotLedger` harus muncul juga di layar admin bidang, bukan hanya admin aplikasi.

Detail keempatnya ada di `CLAUDE.md` dan `docs/erd.md`.
