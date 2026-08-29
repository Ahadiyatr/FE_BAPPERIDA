# PRD — OPERA INK

### Digitalisasi Operasional Indikator Kinerja BAPPERIDA

**Status dokumen:** hidup, direvisi seiring keputusan baru diambil.
**Dokumen pendukung** (baca bersamaan, jangan gantikan salah satu dengan yang lain):

| Dokumen                       | Isinya                                   | Kapan dibaca                                                    |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `CLAUDE.md`                   | Ringkasan cepat untuk sesi baru          | Selalu, di awal sesi                                            |
| `docs/erd.md`                 | Skema database lengkap, mermaid          | Sebelum menulis migrasi atau query                              |
| `docs/keputusan-terbuka.md`   | Asumsi sementara yang sedang dipakai     | Sebelum mengubah rumus atau skema                               |
| `docs/roadmap-perbaikan.md`   | Urutan kerja hasil audit                 | Sebelum memilih task berikutnya                                 |
| `docs/roadmap-refactor-ui.md` | Urutan fase, kriteria "keluar dari fase" | Sebelum memulai modul baru                                      |
| `REFACTOR.md`                 | Peta komponen shadcn, aturan visual      | Sebelum menulis UI apa pun                                      |
| `docs/ui-reference/*.html`    | Acuan visual per layar                   | Sebelum membangun satu layar                                    |
| **PRD ini**                   | Aturan main, definisi selesai, batasan   | Sebelum memutuskan apa pun yang tidak eksplisit di dokumen lain |

Kalau PRD ini bertentangan dengan dokumen lain, **PRD ini yang menang** — dokumen
lain ditulis lebih dulu dan mungkin belum mengikuti keputusan terbaru.

> **Letak berkas.** `docs/` sekarang ada di `FE-bapperrida1/docs/`, bukan di dalam
> paket ini. Acuan visual di `docs/ui-reference/` tertanggal 26 Agustus; ada versi
> lebih baru dan lebih lengkap di `planning/` (`opera-ink-main.html`,
> `opera-ink-master-bidang.html`) yang belum pernah disalin ke sana. Baca yang di
> `planning/` kalau keduanya berbeda.

> **Revisi 29 Agustus 2026.** Seluruh lima keputusan terbuka di §7 sudah dijawab,
> sistem desain §8 dibatalkan dan dikembalikan ke gaya FE lama, dan relasi
> pengguna–bidang berubah jadi satu-ke-satu. Bagian yang terdampak ditandai
> di tempatnya masing-masing.

---

## 1. Apa yang sedang dibangun, dan kenapa

BAPPERIDA (Badan Perencanaan, Penelitian dan Pengembangan Daerah) mencatat capaian
kinerja triwulanan lewat satu berkas Excel bersama, `Operasional_Indikator_Kinerja
_BAPPERIDA.xlsx`. Tujuh bidang mengetik realisasi ke dalam sel yang sama, formula
bobot dihitung manual, dan tidak ada jejak siapa mengubah apa.

**OPERA INK menggantikan Excel itu**, bukan sekadar meniru tampilannya. Definisi
"selesai" untuk seluruh proyek ini: BAPPERIDA berhenti memakai Excel untuk mencatat
capaian, karena sistem web memenuhi semua yang Excel bisa lakukan ditambah hal yang
Excel tidak pernah bisa — jejak audit, bukti foto/dokumen per catatan, dan validasi
yang mencegah kesalahan hitung yang selama ini ada di Excel-nya sendiri.

**Yang bukan tujuan proyek ini:** membuat aplikasi perencanaan pembangunan daerah
yang umum. Setiap keputusan desain diuji terhadap satu pertanyaan: _apakah ini
membantu BAPPERIDA berhenti memakai Excel untuk kasus ini?_ Kalau tidak, itu
di luar cakupan sampai ada yang secara eksplisit memperluasnya.

---

## 2. Rumus inti — non-negotiable

```
Aktifitas Utama       → Bobot Target = 70%      (tetap, satu per subkegiatan)
Aktifitas Pendukung   → Bobot Target = 30% ÷ jumlah aktifitas pendukung aktif
Bobot Realisasi       = (Realisasi ÷ Target) × Bobot Target
Capaian Subkegiatan   = Σ bobot realisasi utama + Σ bobot realisasi pendukung   (maks 100%)
```

**Aturan menulis kode untuk rumus ini:**

- Bobot **tidak pernah** disimpan sebagai input pengguna untuk aktifitas utama —
  selalu `70`, dikunci di level tipe data atau constraint database, bukan cuma
  divalidasi di form.
- Bobot aktifitas pendukung **tidak pernah** diketik manusia — selalu dihitung dari
  `30 / jumlah_pendukung_aktif` di satu fungsi murni (`src/lib/bobot.ts` di
  frontend, satu service class di backend), dipanggil dari semua tempat yang
  membutuhkannya. Dua implementasi rumus yang sama di tempat berbeda adalah bug.
- Kapan pun UI menampilkan capaian dalam bentuk apa pun — angka, warna, meter —
  komponennya harus `BobotMeter`/`BobotLedger` atau turunannya. Menulis `<span>{persen}%</span>`
  polos untuk data capaian adalah pelanggaran terhadap dokumen ini, bukan gaya
  penulisan yang boleh dipilih bebas.
- Tiga kesalahan formula yang ditemukan di Excel sumber **tidak boleh**
  direproduksi. Rinciannya ada di `docs/keputusan-terbuka.md` butir 1 (bukan di
  `docs/erd.md` — bagian itu tidak pernah ditulis):
  `J23 = H23*(H23/G23)` yang kehilangan bobot target di subkegiatan
  5.1.2.2.01.2; **27 dari 78** subkegiatan yang total bobot pendukungnya bukan
  30% (rentang 10%–230%); dan capaian subkegiatan yang tidak pernah dibatasi
  100%. Ketiganya sudah diperbaiki di `src/lib/bobot.ts`. Kalau ada
  keraguan tentang cara menghitung sesuatu, hitung dari definisi rumus di atas,
  jangan dari perilaku Excel yang sudah terbukti salah di beberapa baris.

---

## 3. Prinsip data — non-negotiable

Empat prinsip ini menyilangi seluruh skema (lihat `docs/erd.md` untuk detail tabel):

**Master adalah katalog, transaksi adalah sejarah.** `MASTER_*` tidak pernah tahu
soal bidang atau periode. `TRANS_*` menyalin nilai dari master saat rencana
disusun (nama, kode, target, bobot) — salinan itu beku, tidak pernah dibaca ulang
dari master setelah periode berjalan. Kode yang meng-`JOIN` ke master untuk
menampilkan nama program di laporan periode lama adalah bug, meski hasilnya
terlihat benar hari ini.

**Nonaktifkan, jangan hapus.** Semua tabel master punya `FLAG_ACTIVE`. Tidak ada
`DELETE` untuk data yang mungkin sudah dipakai transaksi — termasuk lewat cascade
delete yang tidak sengaja. Migrasi yang menambah foreign key ke tabel master harus
`restrictOnDelete` atau `nullOnDelete` dengan justifikasi eksplisit di komentar
migrasi, tidak pernah `cascadeOnDelete` secara default.

**Program terikat dokumen perencanaan.** `MASTER_PROGRAM.KODE_PROGRAM` unik per
`DOKUMEN_ID`, bukan global. Query yang mengasumsikan satu kode program hanya
merujuk satu program di seluruh sistem akan salah begitu RPJMD kedua dibuat.

**Satu subkegiatan, satu bidang, per periode.** Ditegakkan lewat
`UNIQUE(PERIODE_ID, SUBKEGIATAN_ID)` di `TRANS_SUBKEGIATAN_BIDANG`. Ini asumsi
aktif sampai ada keputusan eksplisit yang membatalkannya (lihat §7).

---

## 4. Peran pengguna dan batas akses

| Peran              | Bisa                                                                                           | Tidak bisa                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Publik**         | Landing lama di `/` dan `/detail` — capaian per bidang, tanpa login                             | Masuk ke `/opera` sama sekali; lihat realisasi per catatan, lampiran |
| **Admin bidang**   | Catat realisasi, unggah bukti, lihat rencana **bidangnya sendiri saja**                        | Lihat/ubah data bidang lain, ubah data master, buka/kunci periode |
| **Admin aplikasi** | Semua di atas + kelola master, susun rencana semua bidang, buka/kunci periode, kelola pengguna | —                                                                 |

**Aturan menulis kode untuk otorisasi:**

- Setiap query yang mengambil data transaksi (`TRANS_*`) atas nama admin bidang
  **wajib** disaring lewat `BIDANG_ID` yang terikat ke sesi login, di level
  service/repository — bukan cuma disembunyikan di UI. UI yang menyembunyikan
  tombol tapi API yang tidak memvalidasi peran adalah kerentanan, bukan detail kecil.
- **[Direvisi 29 Agu 2026]** Satu user terikat ke **tepat satu** bidang.
  Tabel pivot `USER_BIDANG` di `docs/erd.md` perubahan #7 **dibatalkan** —
  cukup kolom `users.bidang_id`. Yang masih harus diperbaiki di backend:
  relasinya wajib `restrictOnDelete`, bukan `nullOnDelete`, supaya menghapus
  bidang tidak membuat scope query jadi `null` diam-diam.
- **[Direvisi 29 Agu 2026]** Publik tidak pernah masuk `/opera`. Pengunjung
  tanpa login memakai landing lama (`src/pages/Landing.tsx`), sejalan dengan
  dipertahankannya alur login lama. `PenjagaPeran` mengarahkan peran publik ke
  `/`, bukan menampilkan halaman penolakan.
- Publik tidak pernah memanggil endpoint yang sama dengan admin bidang meski
  datanya tumpang tindih — pisahkan endpoint agregat (publik) dari endpoint
  rincian (admin), supaya data mentah realisasi tidak pernah bocor lewat endpoint
  yang salah asumsi soal siapa pemanggilnya.

---

## 5. Kebutuhan fungsional per modul

Status: ✅ sudah dikerjakan · 🔶 dirancang, belum dikerjakan · ⬜ belum dirancang · ➖ gugur

| Modul                        | Status | Ringkasan aturan |
| ---------------------------- | ------ | ---------------- |
| Landing publik (UI lama)     | ✅     | Wajah publik. Tidak login. **Masih memanggil `api.get("/api/dashboard")` langsung** — melanggar §9, sengaja dibiarkan sebagai kode lama. Akibatnya angkanya bisa berbeda dari `/opera` selama fase dummy. |
| Dashboard (admin)            | ✅     | Dulu "dashboard publik". Kini admin saja — memuat bobot bidang dan kontribusi PD yang bukan konsumsi umum. |
| Kinerja bidang (admin bidang)| ✅     | Disaring `BIDANG_ID` sesi. Meter 70/30 wajib di setiap baris capaian. |
| Struktur program (telusur)   | ✅     | Baca-saja, admin bidang + admin aplikasi. **Publik tidak lagi dapat akses ini** — lihat §7 poin terbuka. |
| Capaian Program              | ✅     | Urusan → Program → Kegiatan → Subkegiatan → Aktifitas. Read-only kedua admin. Rumus rollup masih asumsi sementara — lihat §7. |
| Penyusunan rencana           | ✅     | Hanya admin aplikasi. Tombol "tandai siap" nonaktif sampai validasi §6 lolos. |
| Catat realisasi              | ✅     | Hanya admin bidang, hanya bidang sendiri. **Pembatasan periode `OPEN` belum ditegakkan di service** — lihat §6. |
| Bukti kegiatan               | ✅     | Upload di modul ini, fase dummy pakai `URL.createObjectURL`, fase backend pakai storage sungguhan. |
| Data Master (4 tingkat)      | ✅     | Program → Kegiatan → Subkegiatan → Aktifitas. Empat, bukan lima: `MASTER_AKTIFITAS_UTAMA` dibuang (§7.1). |
| Master Program               | ✅     | Terikat dokumen perencanaan. Kode unik per `DOKUMEN_ID` — ditegakkan di service. |
| Master Bidang                | ✅     | Bobot **manual per periode** lewat `TRANS_BOBOT_BIDANG`, divalidasi total 100 (§7.2). |
| Master Periode               | ✅     | Siklus `DRAFT → OPEN → LOCKED`, hanya satu `OPEN` — dijaga di service layer. |
| Master Dokumen Perencanaan   | ✅     | RPJMD lima tahun menaungi RKPD tahunan. Pewarisan program antar dokumen **sengaja belum dibangun** (§7.5). |
| Manajemen Pengguna           | ✅     | Satu bidang per pengguna lewat dropdown tunggal (§4). Admin aplikasi tidak terikat bidang. |
| Log aktivitas/audit          | ✅     | 12 jenis tindakan di 9 service. Pelaku dari `src/services/sesi.ts`. Admin bidang hanya melihat jejak bidangnya — disaring di service. |
| Login & akses ditolak        | ✅     | **Login memakai UI lama** (`src/pages/Login.tsx`). Penolakan akses dipegang `PenjagaPeran`. |
| Ekspor laporan               | ⬜     | Belum dirancang. Format belum diputuskan — lihat §7. |
| Perbandingan antar periode   | ⬜     | Belum dirancang. |
| ~~Usulan perubahan rencana~~ | ➖     | **Gugur.** §7.4 diputuskan: admin bidang tidak menyusun rencana, jadi tidak ada usulan perubahan yang perlu ditampung. |

**Aturan untuk modul berstatus ⬜:** jangan berimprovisasi bentuk UI atau skema
baru untuk modul ini tanpa konfirmasi eksplisit dari pengguna, meski permintaannya
terlihat sederhana. "Belum dirancang" berarti keputusannya sengaja ditunda, bukan
terlewat.

---

## 6. Aturan validasi — dipakai berulang, definisikan sekali

Ini bukan validasi per-form, tapi aturan bisnis yang harus konsisten di semua
tempat yang relevan (form, service, dan idealnya juga constraint database
kalau memungkinkan):

- **Subkegiatan "lengkap" untuk ditandai siap** memerlukan: indikator kinerja
  terisi, target > 0, tepat satu aktifitas utama, minimal satu aktifitas
  pendukung aktif.
  > ⚠️ **Kode belum patuh.** `periksaKesiapan()` memperlakukan "tanpa aktifitas
  > pendukung" sebagai peringatan yang **tidak menghalangi**, bukan syarat.
  > Akibatnya bidang bisa ditandai siap padahal ada subkegiatan yang capaian
  > maksimalnya terkunci di 70%. Aturan di atas yang benar — kodenya yang
  > harus menyusul.
- **Bidang "siap"** memerlukan: seluruh subkegiatan yang ditugaskan ke bidang itu
  berstatus lengkap (di atas).
- **Periode boleh dibuka (`DRAFT → OPEN`)** memerlukan: seluruh bidang berstatus
  siap, dan tidak ada periode lain yang sedang `OPEN`.
  ✅ Sudah ditegakkan di `periode.service.ts`, bukan hanya di tombol.
- **Periode boleh dikunci (`OPEN → LOCKED`)** tidak memerlukan validasi kelengkapan
  — modal konfirmasi cukup menampilkan peringatan (lihat mockup Periode), karena
  mengunci periode yang datanya belum sempurna adalah keputusan admin aplikasi,
  bukan sesuatu yang harus dicegah sistem.
- **Realisasi hanya bisa dicatat** pada `TRANS_INDIKATOR_BIDANG` yang periode
  induknya berstatus `OPEN`, dan bidangnya sama dengan sesi login.
  > ⚠️ **Kode belum patuh — ini lubang integritas paling berisiko.** Diuji
  > langsung ke service, empat operasi tembus ke periode `LOCKED`:
  > `catatRealisasi`, `simpanBobotBidang`, `ubahTargetSubkegiatan`,
  > `tambahAktifitasKeRencana`. Penjaganya hanya ada di UI.
  > Perbaikannya P1.1 di `docs/roadmap-perbaikan.md`.
  >
  > Penjaganya tidak seragam: pencatatan realisasi butuh `OPEN`, sedangkan
  > penyusunan rencana dan bobot bidang boleh di `DRAFT` **atau** `OPEN` —
  > hanya `LOCKED` yang ditolak.

---

## 7. Keputusan — yang sudah dijawab, dan yang masih terbuka

Kelima keputusan lama **sudah dijawab** antara 28–29 Agustus 2026. Daftar terbuka
sekarang berisi hal yang berbeda. **Kalau daftar ini direvisi, revisi `CLAUDE.md`
sekaligus dalam commit yang sama.**

### Sudah dijawab — jangan dibuka lagi tanpa alasan baru

| # | Keputusan | Jawaban | Jejaknya di kode |
| - | --------- | ------- | ---------------- |
| 1 | `MASTER_AKTIFITAS_UTAMA` dihapus atau dipertahankan | **Dihapus**, dilebur ke `MASTER_INDIKATOR` bertipe `UTAMA` | Rantai Data Master jadi 4 mata; nol kemunculan nama tabel itu |
| 2 | Bobot bidang manual atau proporsional otomatis | **Manual per periode** | `TRANS_BOBOT_BIDANG`, divalidasi total 100 di service |
| 3 | Satu subkegiatan boleh lebih dari satu bidang | **Tetap satu** | Ditolak di `tambahSubkegiatanKeRencana` dengan pesan jelas |
| 4 | Admin bidang boleh menambah pendukung di tengah periode | **Tidak boleh** | Admin bidang tidak punya akses penyusunan rencana sama sekali |
| 5 | Penggabungan program antar dokumen perencanaan | **Ditunda** — pewarisan tidak dibangun sampai ada RPJMD kedua yang nyata | Tidak ada `diwarisiDariId` maupun tabel pivot; peringatan eksplisit di `types.ts` dan `dokumen.service.ts` |

### Masih terbuka — berhenti dan tanyakan kalau task menyentuhnya

1. **Rumus rollup capaian Program dan Urusan.** Excel memberi label
   `Capaian Kinerja "Program"` tetapi **tidak pernah menghitungnya** — 3 baris
   berlabel, nol berangka, seluruh 77 rumus berhenti di subkegiatan. Sementara
   ini dipakai rata-rata tak berbobot seluruh subkegiatan, sama dengan yang
   tampil di Dashboard, dan dinyatakan terbuka lewat pita di layar. Alternatifnya
   (berjenjang lewat kegiatan) memberi angka berbeda karena ukuran kegiatan
   timpang di 4 dari 5 program. Rinciannya di `docs/keputusan-terbuka.md` butir 1.

2. **Format ekspor laporan.** CSV tanpa dependency, XLSX mirip berkas asli, atau
   PDF paling siap dikirim ke pimpinan. Menahan modul Ekspor.

3. **Identitas pelaku setelah Fase 6.** Jejak audit sekarang memakai pengguna
   dummy yang dipetakan dari saklar peran (`src/services/sesi.ts`). Bentuk
   kolomnya sudah final; yang berubah nanti hanya sumber identitasnya.

4. **Hak publik atas Struktur Program dan Capaian Program.** §4 versi lama
   memberi publik akses ke keduanya. Sejak publik dikeluarkan dari `/opera`,
   keduanya hanya untuk admin — dan landing lama tidak menyediakan penggantinya.
   Perlu diputuskan: kembalikan akses publik ke dua layar itu, atau terima bahwa
   publik hanya melihat capaian per bidang di landing.

5. **Seberapa harfiah aturan "tidak ada persen polos" di §2.** Layar rollup
   (program, kegiatan, bidang, urusan) menampilkan persen tanpa `BobotMeter`,
   karena 70/30 tidak bermakna di tingkat itu. Kalau §2 dibaca harfiah, itu
   pelanggaran; kalau dibaca sebagai aturan tingkat subkegiatan, sudah patuh.

**Aturan menulis kode terkait daftar terbuka:** kalau sebuah task menyentuh salah
satu dari lima poin di atas, berhenti dan tanyakan sebelum menulis kode — jangan
memilih salah satu opsi secara diam-diam supaya task terlihat selesai. Sebutkan
secara eksplisit poin mana yang tersentuh.

## 8. Sistem desain — ringkasan, detail penuh di REFACTOR.md

> **[Dibatalkan 28 Agu 2026]** Palet OPERA (navy/brass/teal/amber/rust, radius
> 3px, Archivo + IBM Plex) **tidak jadi dipakai**. Keputusan pemilik proyek:
> pertahankan gaya FE lama supaya warna dan tata letak tidak berubah, dan yang
> direfactor hanya isinya. Token `--brass`, `--teal`, `--rust`, `--ledger`
> sudah nol kemunculan di kode. `REFACTOR.md` bagian warna dan radius juga
> ikut kedaluwarsa.

**Yang berlaku sekarang** — kosakata FE lama:

- Warna: emerald (aksi utama, status baik) — slate (netral, aktifitas pendukung)
  — amber (draf/perhatian) — merah (buruk/galat). Ambang capaian hidup di satu
  tempat, `warnaCapaian()` di `src/pages/opera/bagian/ui.tsx`. Jangan menulis
  `persen >= 90 ? …` di komponen halaman.
- Radius bawaan Tailwind. Kartu `rounded-2xl border border-slate-200 shadow-sm`,
  tombol `rounded-xl`. `--radius` di `:root` sengaja **tidak** dipetakan ulang ke
  skala `rounded-*` supaya halaman lama tidak bergeser.
- Font: Geist (`--font-sans`), sama dengan aplikasi lama.
- Header tabel: `bg-slate-50`, huruf kapital, `tracking-wider`.

**Yang tidak berubah dari rancangan awal:**

- Tiga komponen custom wajib dipakai ulang, tidak ditulis ulang per layar:
  `BobotMeter`, `BobotLedger`, `ChainNav` (`src/components/opera/`). Ketiganya
  hanya diwarnai ulang — batang utama emerald, pendukung slate, kotak rumus
  `slate-800`.
- Laci (`Sheet` shadcn, sisi kanan) untuk tambah/ubah data master. `Dialog`
  untuk konfirmasi dan pencatatan realisasi cepat. Jangan tertukar.
- Layar hasil refactor hidup di bawah `/opera`, berdampingan dengan aplikasi
  lama, dan memakai `DashboardLayout` yang sama. Penukaran rute lama ke baru
  dikerjakan sekali jalan setelah semuanya selesai.

---

## 9. Lapisan data — wajib untuk fase dummy maupun backend sungguhan

Setiap layar memanggil fungsi di `src/services/*.ts`
(`getSubkegiatan()`, `catatRealisasi()`, dst), **tidak pernah** memanggil `fetch`
langsung dari komponen. Ini bukan preferensi gaya — ini yang membuat migrasi dari
data dummy ke backend sungguhan (Fase 6 di roadmap) menjadi penggantian isi
fungsi, bukan penulisan ulang komponen.

Bentuk data dummy mengikuti `docs/erd.md` (tujuan), bukan bentuk API
`BE_BAPPERIDA` yang sekarang (kondisi sebelum refactor).

**Satu pengecualian yang disengaja:** landing publik lama (`src/pages/Landing.tsx`)
masih memanggil `api.get("/api/dashboard")` langsung. Ia dipertahankan apa adanya
sebagai kode lama, bukan contoh yang boleh ditiru. Akibat praktisnya: selama fase
dummy, angka di landing datang dari backend lama sementara `/opera` memakai data
mock — **keduanya bisa berbeda**, dan landing akan kosong kalau backend lama mati.
Kalau keduanya harus bercerita hal yang sama saat demo, landing perlu dipindah ke
lapisan service lebih dulu.

**`docs/erd.md` tertinggal empat tabel/kolom** yang sudah hidup di lapisan mock dan
harus masuk ERD sebelum Fase 6: `MASTER_URUSAN`, `MASTER_DOKUMEN`,
`MASTER_PROGRAM.DOKUMEN_ID` dengan `UNIQUE(DOKUMEN_ID, KODE_PROGRAM)`,
`MASTER_PERIODE.DOKUMEN_ID`, dan `TRANS_LOG_AKTIVITAS`. Ditambah status kesiapan
bidang per periode yang juga belum punya tempat (lihat `docs/keputusan-terbuka.md`).

---

## 10. Definisi selesai — dipakai untuk menilai satu modul, bukan seluruh proyek

Sebuah modul dianggap selesai kalau:

1. Cocok dengan salah satu berkas di `docs/ui-reference/` **atau** ada catatan
   eksplisit di commit/PR yang menjelaskan kenapa menyimpang.
2. Memakai `BobotMeter`/`BobotLedger`/`ChainNav` di tempat yang seharusnya
   (lihat §2 dan §8) — bukan re-implementasi lokal.
3. Otorisasi disaring di level service, bukan hanya UI (§4).
4. Tidak diam-diam memilih salah satu dari lima keputusan terbuka di §7.
5. Bisa didemokan sebagai alur nyata dari awal sampai akhir — kriteria detail
   per modul ada di `docs/roadmap-refactor-ui.md` bagian "keluar dari fase".

Modul yang lolos kelima poin ini boleh ditandai ✅ di tabel §5.

---

## 11. Yang secara eksplisit di luar cakupan sampai diperluas

- Aplikasi mobile native (web responsif sudah cukup untuk sekarang).
- Multi-instansi/multi-tenant — sistem ini untuk satu BAPPERIDA, bukan
  disewakan ke instansi lain.
- Integrasi otomatis ke SIPD atau sistem pemerintah lain — kalau muncul
  permintaan ini, itu perluasan cakupan yang butuh PRD terpisah.
- Mode luring (offline-first). Admin bidang diasumsikan punya koneksi internet
  saat mencatat realisasi.

---

## 12. Cara memakai dokumen ini di Claude Code

Prompt yang disarankan untuk sesi baru:

```
Baca PRD.md, CLAUDE.md, docs/erd.md, dan docs/roadmap-refactor-ui.md.
Kerjakan: [task]
Sebelum menulis kode: sebutkan apakah task ini menyentuh salah satu dari lima
keputusan terbuka di PRD.md §7. Kalau ya, berhenti dan tanyakan dulu.
```

Kalau menemukan kode yang melanggar salah satu aturan non-negotiable di §2–§4
(bobot diketik manual, query tidak disaring bidang, cascade delete ke master,
dsb), itu bug yang harus dilaporkan meski tidak diminta mencarinya — bukan
gaya penulisan alternatif yang sah.
