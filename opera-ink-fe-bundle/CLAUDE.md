# OPERA INK — Konteks Proyek

> Berkas ini merangkum sebuah sesi perancangan di claude.ai (bukan Claude Code) yang
> mendigitalisasikan `Operasional Indikator Kinerja BAPPERIDA.xlsx` menjadi sistem web.
> Baca ini di awal setiap sesi Claude Code sebelum mengerjakan UI atau skema baru —
> supaya keputusan yang sudah diambil tidak diulang atau dilanggar tanpa sadar.

## Apa aplikasi ini

Sistem pencatatan capaian kinerja BAPPERIDA per triwulan. Backend Laravel 13
(`opera-backend`, skill terpisah di `.claude/skills/opera-backend/` — baca
`references/business-logic.md` di sana untuk detail formula bobot sebelum menyentuh
apa pun yang berhubungan dengan capaian).

Tiga peran pengguna:
- **Publik** — lihat dashboard, tidak login.
- **Admin bidang** — mencatat realisasi, mengunggah bukti, untuk satu bidang saja.
- **Admin aplikasi** — mengelola master, menyusun rencana per periode, membuka/mengunci periode.

## Rumus inti — jangan diubah tanpa alasan kuat

```
Aktifitas Utama       → Bobot Target = 70%      (tetap, satu per subkegiatan)
Aktifitas Pendukung   → Bobot Target = 30% ÷ jumlah aktifitas pendukung aktif
Bobot Realisasi       = (Realisasi ÷ Target) × Bobot Target
Capaian Subkegiatan   = Σ bobot realisasi utama + Σ bobot realisasi pendukung   (maks 100%)
```

Setiap layar yang menampilkan capaian HARUS memperlihatkan pembagian 70/30 ini secara
visual (lihat "Meter bobot" di bawah), bukan cuma angka akhir — itu keluhan utama
pengguna Excel: "kok angkanya beda dari hitungan saya."

## Struktur data sumber (dari Excel)

5 program → 20 kegiatan → 78 subkegiatan → aktifitas (utama + pendukung),
dipetakan ke 7 bidang: P2EPD (15), SEKRETARIAT (19), PIK (12), RINOVA (11),
Subbag Perencanaan (9), PPM (8), Keuangan (4).

## Empat masalah skema yang BELUM diperbaiki — putuskan sebelum migrasi baru

1. **Jembatan bidang/periode terpasang di tingkat aktifitas, bukan subkegiatan.**
   `TRANS_INDIKATOR_BIDANG.MASTER_INDIKATOR_ID` menunjuk ke `MASTER_INDIKATOR` (tingkat
   aktifitas). Tidak ada baris yang mewakili "capaian Bidang X untuk subkegiatan Y".
   Usulan: sisipkan `TRANS_SUBKEGIATAN_BIDANG` (PERIODE_ID + BIDANG_ID +
   INDIKATOR_UTAMA_ID) di antaranya.

2. **`MASTER_BIDANG.BOBOT` tidak punya periode.** Satu nilai berlaku selamanya — ubah
   bobot tahun depan, capaian periode lama yang diarsipkan ikut bergeser kalau dihitung
   ulang. Perlu dibekukan per periode.

3. **Relasi user↔bidang.** `users.bidang_id` nullable + `nullOnDelete`: satu user hanya
   bisa satu bidang (padahal Sekretariat & Keuangan bisa dipegang orang yang sama), dan
   bidang terhapus membuat scope query jadi `null` diam-diam. Pertimbangkan tabel pivot
   dan `restrictOnDelete`.

4. **`MASTER_AKTIFITAS_UTAMA` duplikat dengan `MASTER_INDIKATOR` tipe `UTAMA`.** Sama-sama
   nama, bobot 70%, urutan, gantung ke `INDIKATOR_UTAMA_ID` yang sama — tidak ada yang
   menyinkronkan. `TransAktifitasUtama::lampirans()` dan `TransRealisasiKegiatan::lampirans()`
   juga berebut kolom `REALISASI_ID` yang sama tanpa pembeda tipe parent.
   **Belum diputuskan** apakah `MASTER_AKTIFITAS_UTAMA` dibuang (rekomendasi) atau
   dipertahankan karena ada kebutuhan lain yang belum diketahui.

**Pertanyaan terbuka ke pemilik produk:** apakah satu subkegiatan bisa dipegang lebih
dari satu bidang? Excel-nya menjawab tidak (kolom K satu nama) — kalau tetap begitu,
perbaikan #1 aman dikerjakan.

## Sistem desain UI — dipakai konsisten di semua layar

Referensi visual lengkap ada di `docs/ui-reference/*.html` (buka langsung di browser).
Kalau membuat layar baru, samakan token dan pola ini:

**Warna**
```
--ink:#0D1B2A        navy gelap — sidebar, buku besar bobot
--paper:#EDEFF2       latar halaman
--surface:#FFFFFF     kartu, tabel
--brass:#B08130       aksen utama — aktifitas UTAMA, tombol penting, highlight
--teal:#0F766E        aktifitas PENDUKUNG, status positif
--amber:#C2870B       status peringatan/draf
--rust:#A63D2E         status buruk/tertinggal
```

**Tipografi**: Archivo (judul, angka besar), IBM Plex Sans (isi), IBM Plex Mono
(kode, angka tabular, label eyebrow huruf kapital berspasi lebar).

**Pola komponen wajib:**
- **Meter bobot 70/30** — batang tersegmen: satu blok besar (70%, warna brass) +
  N blok kecil (30%÷N tiap satu, warna teal). Dipakai di mana pun capaian subkegiatan
  ditampilkan. Jangan hanya menampilkan angka persen polos.
- **Buku besar bobot** (`.ledger`, latar navy `--ink`) — menunjukkan hitungan
  70% + (30%÷n) = X% secara eksplisit di form/detail, bukan disembunyikan di balik formula.
  Sertakan kalimat konsekuensi, mis. "Menambah baris ini menurunkan bobot 4 aktifitas
  lain dari 7,5% menjadi 6,0%."
- **Rantai navigasi bertingkat** (`.chain`) — untuk data berjenjang (program → indikator
  utama → indikator sub), bukan tab sejajar biasa. Klik angka anak di tabel untuk turun
  tingkat sambil menyaring induknya (`.scope` pita di atas tabel).
- **Laci (drawer) kanan**, bukan modal tengah — untuk form tambah/ubah pada tabel master.
  Modal tengah dipakai untuk konfirmasi & pencatatan realisasi cepat.
- **Nonaktifkan, jangan hapus** — semua master punya `FLAG_ACTIVE`. Tombol berbunyi
  "Nonaktifkan" / "Aktifkan kembali", tidak pernah "Hapus" untuk data yang mungkin
  sudah dipakai transaksi.
- **Rumus ditampilkan, bukan disembunyikan** — blok formula gelap muncul di detail
  subkegiatan dan sebelum tombol simpan pada form realisasi.

## Layar yang sudah dirancang (lihat docs/ui-reference/)

| Berkas | Peran | Isi |
|---|---|---|
| `opera-ink-ui.html` | Publik + Admin bidang | Dashboard umum, kinerja bidang, struktur program, catat realisasi, bukti kegiatan, periode, master (kerangka awal) |
| `opera-ink-penyusunan.html` | Admin aplikasi | Papan kesiapan 7 bidang → workbench 3 kolom (navigator subkegiatan / editor / pemeriksaan) untuk menyusun rencana per periode, termasuk salin-dari-periode-lalu |
| `opera-ink-master.html` | Admin aplikasi | CRUD 5 master berjenjang: Program → Indikator Utama → Indikator Sub / Aktifitas Utama / Aktifitas Pendukung, dengan penanda tumpang-tindih #4 di atas |

## Layar yang BELUM dirancang — kandidat lanjutan

- Master Bidang (CRUD, termasuk bobot per periode setelah masalah #2 diputuskan)
- Master Periode (buka/kunci, arsip)
- Manajemen pengguna (admin bidang per bidang, setelah masalah #3 diputuskan)
- Layar "usulan perubahan rencana" — kalau admin bidang boleh menambah aktifitas
  pendukung di tengah periode berjalan (lihat diskusi di riwayat percakapan)
- Ekspor laporan (PDF/Excel) capaian per periode

## Berkas lain di paket ini

- `docs/roadmap-perbaikan.md` — **urutan kerja hasil audit 29 Agustus 2026**, dari
  yang merusak data ke yang kosmetik. Mulai dari P1 (penjaga periode terkunci)
  sebelum menyentuh yang lain.
- `docs/keputusan-terbuka.md` — **hal yang belum diputuskan tapi sudah tersentuh
  kode**, beserta asumsi sementara yang sedang dipakai dan berkas mana yang
  berubah saat dijawab. Butir terpentingnya: Excel tidak pernah menghitung
  capaian Program/Kegiatan/Urusan — hanya memberi labelnya.
- `docs/erd.md` — rancangan skema database usulan (mermaid), termasuk tabel peta
  penggantian nama dari skema lama.
- `docs/roadmap-refactor-ui.md` — urutan fase mengerjakan refactor UI dengan data
  dummy, backend menyusul. **Baca ini sebelum mengerjakan layar apa pun** — ada
  kriteria "keluar dari fase" yang menentukan kapan boleh lanjut ke layar berikutnya.
- `REFACTOR.md` — peta pola mockup ke komponen shadcn (`radix-nova`), dan aturan
  yang tidak boleh dilanggar (bobot tidak pernah jadi input, nonaktifkan bukan
  hapus, radius 3px, dst).
- `src/index.css`, `tailwind.config.js`, `src/components/opera/*.tsx` — starter kit
  token dan tiga komponen yang tidak ada padanannya di shadcn: `BobotMeter`,
  `BobotLedger`, `ChainNav`.

## Cara melanjutkan di Claude Code

1. Baca berkas ini, lalu `docs/roadmap-refactor-ui.md` untuk tahu fase mana yang
   sedang dikerjakan.
2. Sebelum membuat layar baru: buka berkas relevan di `docs/ui-reference/` sebagai
   acuan pola visual, dan `REFACTOR.md` untuk tahu komponen shadcn mana yang dipetakan.
3. Pertahankan token warna dan pola komponen wajib di atas — jangan improvisasi
   warna atau bentuk komponen baru yang belum ada di `REFACTOR.md`.
4. Kalau `src/index.css`, `tailwind.config.js`, atau `src/components/opera/`
   belum ada di repo ini, itu tandanya Fase 0 (roadmap) belum dikerjakan — mulai
   dari situ sebelum menyentuh layar mana pun.
5. Tanyakan dulu ke pengguna kalau layar baru itu menyentuh salah satu dari empat
   masalah skema yang belum diputuskan di atas.
