# Register Tiket OPERA INK

> **Berkas ini satu-satunya tempat status tiket hidup.** Menutup atau mengubah satu tiket =
> mengubah satu baris di sini, tidak ada berkas lain yang perlu disentuh.
>
> Laporan audit bertanggal di `../audits/` **dibekukan**: status di sana adalah keadaan pada
> hari audit dan sengaja tidak diperbarui, karena justru itu nilainya sebagai bukti. Butir
> keputusan di `../keputusan-terbuka.md` mencatat *alasan* sebuah keputusan diambil, bukan
> status tiketnya.
>
> Jumlah tiket per prioritas **tidak ditulis di sini** supaya tidak bisa basi. Hitung kapan
> pun dengan `python3 ../../scripts/hitung-tiket.py`.

## Urutan pengerjaan yang berlaku

Diperbarui 2 Oktober 2026. **Inilah daftar yang berlaku** — daftar urutan di laporan audit
mana pun sudah beku pada tanggalnya dan akan menampilkan pekerjaan yang sebenarnya sudah
selesai, jadi jangan dipakai sebagai acuan kerja.

1. **P1-R08** — satukan kebijakan kata sandi. **Kerjakan sebelum rotasi kata sandi dijalankan**,
   kalau tidak rotasinya bisa menyetel ulang kata sandi lemah dan tetap lolos validasi.
2. **P1-R09** — konfigurasikan `trustProxies` di server, lalu verifikasi `$request->ip()`
   mengembalikan IP klien. Tanpa ini pembatas laju P0-R02 tidak bekerja di produksi.
3. **P3-R01, P3-R02** — kebijakan retensi jejak audit, dan dua kebersihan kecil.


**Seluruh penghalang rilis P0 sudah tertutup.** Selesai 1–2 Oktober 2026: P0-R01, P0-R02,
P0-R03, P0-R04, P1-R01, P1-R02, P1-R03, P1-R04, P1-R05, P1-R06, P1-R07, P2-R01, P2-R04, P2-R05.

> **Seluruh P0 dan P1 tertutup, dan gerbang rilis otomatis sudah terpasang.** Suite backend
> hijau 263/263 sejak 2 Okt 2026, tidak ada tes yang sengaja merah, dan CI menjalankan gerbang
> itu pada setiap push dan pull request di kedua repo. Tiket baru yang dibuka sebagai tes merah
> ditandai `#[Group('papan-skor')]` supaya tidak memerahkan gerbang — dan tandanya dihapus
> begitu tiketnya ditutup. Lihat `AGENTS.md` §Gerbang rilis.

> **Tindakan operasional tertunda dari P1-R05.** Peralihan zona waktu aplikasi dari UTC ke
> `Asia/Makassar` membuat 16 pasang `CREATED_AT`/`UPDATED_AT` yang sudah ada terbaca 8 jam lebih
> awal daripada maksudnya, karena baris lama ditulis dalam UTC sementara baris baru ditulis
> dalam WITA. Kolom bisnis (`TANGGAL_*`) tidak terpengaruh karena bertipe `date` murni. Dua
> pilihan: geser sekali seluruh timestamp lama dengan `UPDATE … SET CREATED_AT = CREATED_AT +
> INTERVAL 8 HOUR`, atau terima diskontinuitasnya dan catat tanggal peralihannya. Keputusan ini
> milik pemilik data, bukan kode.

> **Tindakan operasional tertunda dari P0-R03.** Rotasi kata sandi pada setiap lingkungan yang
> basis datanya pernah di-seed atau berasal dari dump di repo: keenam belas akun di sana masih
> berkata-sandi `password`. Pagar baru hanya mencegah akun baru, tidak memperbaiki yang sudah ada.

Sumber kebenaran bisnis: `docs/Operasional Indikator Kinerja BAPPERIDA.xlsx`.
Audit yang membuka tiket-tiket di bawah, berurut waktu:
[29 Agu](../audits/audit-ulang-kesesuaian-excel.md) ·
[30 Agu](../audits/audit-sistem-independen.md) ·
[6 Sep](../audits/audit-menyeluruh-2026-09-06.md) ·
[12 Sep FE](../audits/audit-bug-frontend-2026-09-12.md) ·
[13 Sep BE](../audits/audit-bug-backend-2026-09-13-menyeluruh.md) ·
[1 Okt produksi](../audits/audit-kesiapan-produksi-2026-10-01.md) ·
[3 Okt susulan](../audits/audit-susulan-2026-10-03.md).

---

## Tiket — status berjalan

Inilah bagian yang diperbarui saat bekerja: satu baris per tiket, dikelompokkan
per prioritas. Semua bagian lain di berkas ini adalah riwayat dan tidak perlu disentuh.

### P0 — Penghambat kesesuaian inti

| Tiket                                           | Respons implementasi saat ini                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status     | Penilaian terhadap Excel / tindakan berikutnya                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 Target aktivitas                          | `TARGET_ANJURAN` kini tersimpan pada `MASTER_AKTIFITAS`, tervalidasi dan diekspos API. Penugasan membekukan nilainya ke `TRANS_AKTIFITAS_BIDANG.TARGET`; seeder dan backfill juga mengisinya dari snapshot rencana.                                                                                                                                                                                                                                                                           | ✅ Selesai | Diverifikasi: 439 master aktivitas terisi, tidak ada target kosong atau mismatch terhadap snapshot rencana; tes katalog dan penugasan lulus (29/29).                                                                                                                                                                                                                                                                        |
| P0-02 Tujuh unit penanggung jawab               | Importer mempertahankan tujuh unit sumber: P2EPD, PPM, PIK, RINOVA, Subbag Perencanaan, Keuangan, dan SEKERTARIAT. Migrasi kompatibilitas memindahkan penugasan instalasi lama menurut katalog sumber serta menonaktifkan lima kategori gabungan.                                                                                                                                                                                                                                             | ✅ Selesai | Diverifikasi: 78 penugasan tersebar pada tujuh unit sumber (15/8/12/11/9/4/19); tes katalog dan penugasan lulus (29/29).                                                                                                                                                                                                                                                                                                    |
| P0-03 Tambah aktivitas pendukung                | Endpoint aktivitas ad-hoc kini menerima `admin_aplikasi` dan `admin_bidang`. Controller memakai guard bidang bersama: admin aplikasi berakses penuh, sedangkan admin bidang tetap dibatasi relasi `USER_BIDANG`. Daftar rencana juga secara eksplisit memuat relasi aktivitas, sehingga aktivitas ad-hoc yang baru ditambah langsung tampil pada layar rencana.                                                                                                                               | ✅ Selesai | Diverifikasi: `POST/PATCH/DELETE /api/v1/aktifitas-bidang` memakai middleware dua peran; tes regresi memastikan daftar rencana mengembalikan aktivitas ad-hoc; 138 tes backend lulus.                                                                                                                                                                                                                                       |
| P0-04 Gerbang kesiapan periode                  | Status kesiapan kini persisten di `TRANS_KESIAPAN_BIDANG`; endpoint papan kesiapan dan aksi tandai/batalkan siap memakai backend. Setiap perubahan rencana atau aktivitas membatalkan status siap bidang tersebut. Prapemeriksaan layar Periode juga membaca endpoint kesiapan yang sama, menonaktifkan aksi Buka untuk bidang belum siap/periode tanpa pembagian, serta menampilkan alasan dan nama bidang penghalang. | ✅ Selesai | `PATCH /periode/{id}/buka` tetap memeriksa ulang pembagian bidang, target positif, tepat satu aktivitas utama, minimal satu pendukung, dan bobot 70/30 = 100; periode tanpa rencana atau bidang belum siap ditolak. Regresi UI 422 diverifikasi dengan lint terarah tanpa temuan serta tes `KesiapanPeriodeTest` + `PeriodeTest`: **15 tes, 55 assertion lulus**. |
| P0-05 Presisi bobot 30/n                        | ✅ **Premis disahkan 6 Sep 2026 lewat P1-15.** Angka `4,29` berasal dari aturan 30/n; aturan itu kini keputusan bisnis tertulis (`../keputusan-terbuka.md` §2b), sehingga normalisasi 20 transaksi historis sah. Algoritma aktif menyimpan dua desimal dan memberikan selisih pembulatan kepada aktivitas pendukung terakhir. Sebanyak 20 transaksi historis (`ID` rencana 16–35) yang semula menyimpan `4,29 × 7 = 30,03` telah dikoreksi manual melalui `CapaianService::redistribusiBobotPendukung()`. | ✅ Selesai | Audit pascakoreksi menemukan **0** rencana dengan bobot selain 70/30/100. Empat kasus laporan pengguna kini masing-masing `70,00 + 30,00 = 100,00`; kesiapan bidang 10 dan 11 lulus tanpa butir penghalang. Tes bobot terarah lulus **8 tes, 40 assertion**. Tidak dibuat migration/backfill permanen sesuai keputusan koreksi data manual. **Verifikasi ulang 6 Sep 2026:** invarian tetap utuh — nol baris rencana berbobot selain 100 di `opera_ink_audit` maupun `opera_ink_rev2`. Pertanyaan apakah 30/n memang aturan workbook sudah dijawab oleh P1-15: bukan aturan workbook, tetapi kebijakan yang disahkan. |
| P0-06 Keunikan penugasan subkegiatan            | Constraint database kini unik pada `(periode, subkegiatan)`; endpoint penugasan menolak konflik sebelum insert dan menyebut bidang penanggung jawab yang ada.                                                                                                                                                                                                                                                                                                                                 | ✅ Selesai | Satu penanggung jawab per subkegiatan-periode ditegakkan untuk data baru maupun migrasi. Migration dihentikan dengan pesan jelas bila data lama masih mempunyai konflik.                                                                                                                                                                                                                                                    |
| P0-07 Output kinerja                            | Parser kanonik import kini memuat `OPERA INK` bersama `Programmed`, lalu menyalin output eksplisit memakai pasangan kode/nama subkegiatan. `audit.output_kinerja_terisi` membuat hasilnya terlihat pada preview maupun import final; workbook dibersihkan setelah parse agar tidak mengakumulasi sel di memori. | ✅ Selesai | `OperaInkSeederTest` membuktikan output sumber `Misal : Pelaksanaan Kegiatan Konsultasi Dokumen Ke Kemendagri/?` muncul pada preview dan import resmi, tersimpan pada master, dibekukan ke transaksi saat penugasan, lalu tampil pada monitoring dan CSV (**3 tes, 38 assertion lulus**). |
| P0-08 Satuan katalog dan resolusi target kosong | `opera-ink-katalog.json` diregenerasi dari workbook. Parser menyimpan satuan sumber yang tersedia, menandai target kosong `5.1.1.2.01.2` sebagai `TARGET_NOL_DIIZINKAN`, dan seeder membekukan flag tersebut ke transaksi. Gerbang kesiapan menolak target `<= 0` kecuali flag eksplisit tersebut; resource API juga mengembalikannya. Migration `000026` menambahkan flag, sedangkan `000027` melakukan backfill terarah pada master dan snapshot transaksi lama. Keduanya sudah diterapkan. | ✅ Selesai | Diverifikasi end-to-end oleh `OperaInkSeederTest`: sel `L12/L20/L28` workbook (`2/3 Dokumen`, `1 Berita Acara`) tersimpan di database, `L393` tetap kosong dan diperlakukan dengan flag eksplisit, seluruh bidang dapat ditandai siap, lalu periode hasil fresh seed berhasil dibuka. Pemeriksaan MySQL lokal mengonfirmasi tiga satuan dan flag pada empat record terkait. Suite backend lulus **143 tes, 795 assertion**. **Lanjutan 6 Sep 2026:** empat subkegiatan yang bobot workbook-nya sendiri hanya 80–90% (`5.1.1.2.01.3`, `5.1.1.2.01.4`, `5.1.1.2.01.5`, `5.1.3.2.01.1`) kini punya resolusi `DINORMALKAN_KE_100` yang dideteksi programatik dari rentang SUM kolom M; parser berhenti bila menemukan cacat baru tanpa keputusan. `quality_issues` 76 → 80; katalog selain itu identik. Tes regresi **22 asersi**, suite penuh **214 tes / 1128 asersi lulus**. |
| P0-09 Capaian basi setelah redistribusi bobot | `CapaianService::redistribusiBobotPendukung()` kini menyimpan seluruh `BOBOT_TARGET` hasil pembagi baru, kemudian memanggil `recalculateAktifitas()` untuk setiap pendukung sebelum rollup akhir subkegiatan. Jalur tambah/hapus aktivitas pada periode OPEN tidak lagi mempertahankan `BOBOT_REALISASI` dari pembagi lama. | ✅ Selesai | Tes regresi berangkat dari realisasi yang sudah menghasilkan capaian 90,00, lalu menambah pendukung keempat: bobot target dan realisasi dua pendukung tercapai berubah dari 10,00 ke 7,50, capaian menjadi 85,00, dan tidak ada baris dengan `BOBOT_REALISASI > BOBOT_TARGET`. `CapaianServiceTest`: **10 tes, 37 asersi lulus**; suite fitur capaian + penyusunan: **52 tes, 227 asersi lulus**; suite backend 512 MB: **213 tes, 1104 asersi lulus**. Rincian temuan awal: [`../audits/audit-menyeluruh-2026-09-06.md`](../audits/audit-menyeluruh-2026-09-06.md) §A-01. |

### P1 — Risiko tinggi

| Tiket                               | Respons implementasi saat ini                                                                                                                                                                                                                                                                                                                                                               | Status         | Penilaian / tindakan berikutnya                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1-01 Koreksi kode sumber           | Importer menggunakan `CODE_CORRECTIONS` eksplisit yang mengikat kode sumber dan nama subkegiatan. Katalog hasil import memuat `audit_import.corrections`, dan seeder menampilkan setiap koreksi.                                                                                                                                                                                            | ✅ Selesai     | Tiga pergeseran kode akibat duplikasi sumber `5.1.2.2.01.4` kini dapat ditinjau; import gagal bila kode hasil tetap duplikat.                                                              |
| P1-02 Target/satuan kosong          | `quality_issues` kini mencatat nilai sumber kosong tanpa mengubahnya. Artefak aktif telah diregenerasi; tiga satuan yang tertulis di workbook tersimpan, dan target kosong `5.1.1.2.01.2` mempunyai resolusi `DISETUJUI_TANPA_TARGET` dengan flag operasional `TARGET_NOL_DIIZINKAN`.                                                                                                       | ✅ Selesai     | Ditutup bersama P0-08: fixture menguji workbook → JSON → database serta pembukaan periode; tidak ada target atau satuan yang diisi melalui tebakan.                                        |
| P1-03 Visual bobot fleksibel        | `BobotMeter` memakai `bobotTarget` aktual untuk lebar segmen, tooltip, label aksesibilitas, dan legenda. Warna dasar menunjukkan alokasi, warna pekat menunjukkan progres realisasi, sedangkan legenda merangkum utama/pendukung tanpa mengulang daftar bobot panjang. | ✅ Selesai     | Visual menampilkan pembagian aktual, termasuk selisih pembulatan aktivitas pendukung terakhir. Tes komponen dan algoritma bobot lulus **19 tes**; lint dan production build frontend lulus. |
| P1-04 Aktivitas utama nonaktif      | Kebijakan eksplisit: `FLAG_ACTIVE` hanya berlaku untuk katalog penugasan baru; transaksi yang sudah tersalin tetap snapshot historis dan tetap dihitung pada rollup. Validasi satu UTAMA kini hanya menghitung master yang aktif.                                                                                                                                                           | ✅ Selesai     | Diverifikasi: UTAMA nonaktif tidak menghalangi UTAMA aktif pengganti; penugasan ditolak bila katalog tidak memiliki UTAMA aktif; 135/135 tes backend dan build frontend lulus.             |
| P1-05 Opsi salin periode            | UI kini mengirim seluruh opsi ke backend. Struktur subkegiatan tetap wajib; aktivitas dapat tidak disalin, target dapat dikembalikan ke nilai anjuran master, dan subkegiatan sumber dengan capaian nol dapat dikecualikan. Respons juga mengembalikan jumlah subkegiatan dan aktivitas yang benar-benar disalin. Request klien lama tanpa opsi tetap kompatibel: seluruh rencana tersalin. | ✅ Selesai     | Ditutup oleh tes opsi salin (target, aktivitas, capaian nol) dan tes kompatibilitas salin lama.                                                                                            |
| P1-06 Capaian program               | Layar capaian program, rincian kegiatan, struktur subkegiatan, dan daftar tertinggal memakai endpoint backend `monitoring/kinerja`; tidak ada fallback mock pada alur produksi. Pengelompokan urusan dihapus karena tidak ada pada model backend maupun workbook.                                                                                                                           | ✅ Selesai     | Respons monitoring kini juga membawa jumlah catatan realisasi per aktivitas untuk tampilan rincian yang akurat. Ditutup oleh tes endpoint dan build frontend.                              |
| P1-07 Rumus rollup program/kegiatan | Keputusan bisnis 30 Agustus 2026 menetapkan capaian kegiatan dan program sebagai rata-rata langsung tak berbobot seluruh `CAPAIAN` subkegiatan di bawahnya, dibulatkan dua desimal. Tidak ada rerata berjenjang kegiatan → program dan tidak ada bobot bidang. Keputusan serta konsekuensinya didokumentasikan di `../keputusan-terbuka.md` dan kontrak API.                                   | ✅ Selesai     | Fixture `MonitoringKinerjaTest` menguji sebaran timpang: `35, 0, 100` menghasilkan program `45,00`, bukan `58,75` dari rerata berjenjang. Tes Monitoring lulus **6 tes, 27 assertion**.    |
| P1-08 Buka kembali periode          | Workflow tetap terminal `DRAFT → OPEN → LOCKED`. UI kini hanya menampilkan aksi Buka untuk DRAFT, Kunci untuk OPEN, dan tidak menawarkan transisi untuk LOCKED.                                                                                                                                                                                                                             | ✅ Selesai     | Diverifikasi: tes workflow periode lulus (14/14), backend tetap menolak buka ulang LOCKED, dan build frontend lulus.                                                                       |
| P1-09 Log aktivitas                 | Endpoint, penyimpanan, pencatatan mutasi inti, UI, serta pembatasan akses admin aplikasi tersedia dan diuji.                                                                                                                                                                                                                                                                                | ✅ Selesai     | Tambahkan before/after dan event autentikasi bila dibutuhkan sebagai audit trail penuh.                                                                                                    |
| P1-10 Ekspor                        | Dashboard Umum kini menyediakan tombol unduh CSV untuk admin aplikasi. CSV rincian memuat struktur subkegiatan, indikator, output, target/capaian, daftar aktivitas, target/realisasi aktivitas, serta nama bukti lampiran yang tersedia.                                                                                                                                                   | ✅ Selesai     | Diverifikasi: ekspor tetap satu baris per subkegiatan agar mudah dibuka di Excel; tes ekspor dan seluruh tes backend lulus (135/135), build frontend lulus.                                |
| P1-11 Pengguna satu bidang          | Kebijakan produk diubah menjadi satu pengguna maksimal satu bidang. API dan UI memakai `bidang_id`; tabel `USER_BIDANG` dipertahankan untuk kompatibilitas guard, dengan constraint unik pada `USER_ID`.                                                                                                                                                                                    | ✅ Selesai     | Migrasi menolak penerapan bila ada relasi ganda agar tidak membuang data diam-diam; database aktif diverifikasi 5 relasi untuk 5 pengguna. Tes backend (135/135) dan build frontend lulus. |
| P1-12 Hirarki dokumen perencanaan   | ⏸ **Ditangguhkan / bypass business logic.** Keputusan domain RPJMD/RKPD belum tersedia. Sampai ada keputusan tertulis, dokumen tetap datar dan tidak dipakai sebagai asumsi dalam rollup, kesiapan periode, penugasan, realisasi, atau ekspor.                                                                                                                                              | ⏸ Ditangguhkan | Jangan implementasikan hirarki, pewarisan, atau alur turunkan program sampai keputusan produk menetapkan model, relasi, dan aturan historinya.                                             |
| P1-13 Tes perilaku frontend | Runner Vitest/jsdom/Testing Library dan script `npm test` tersedia. Cakupan kini meliputi dialog sesi kedaluwarsa, Master Bidang, konfirmasi realisasi, filter aktivitas, kalender, penunjukan, layar periode, rencana bidang, manajemen pengguna, bobot, peran, dan service capaian. | ✅ Selesai | Diverifikasi 6 Sep 2026: `npm test` lulus **16 berkas, 125 tes**. Instalasi dependency melaporkan 18 advisory transitif; jangan jalankan pembaruan mayor otomatis tanpa audit kompatibilitas. |
| P1-14 Mode Subkegiatan dan detail Rencana Saya | `Rencana Saya` menyediakan mode **Subkegiatan** sebagai default dan **Aktivitas** sebagai tampilan alternatif. Tabel subkegiatan menampilkan kode/nama, indikator, target/satuan, jumlah aktivitas, agregat catatan/bukti, capaian, serta aksi Detail. Halaman `/rencana-saya/{id}` memakai snapshot transaksi dan menampilkan struktur, indikator/output, bobot, realisasi, bukti, status periode, serta deep-link pencatatan. | ✅ Selesai | Endpoint ringkas tidak memuat detail realisasi; endpoint detail memeriksa kepemilikan bidang dan mengembalikan 404 untuk ID bidang lain. Kontrak lengkap lama tetap dipakai tanpa perubahan oleh Catat Realisasi/Bukti. Aksi Catat hanya tersedia saat `OPEN`; DRAFT/LOCKED hanya-baca. Tes backend **40 tes, 172 assertion lulus**; lint dan production build frontend lulus. Konsekuensi: terdapat satu endpoint/route detail baru dan sekitar 10 kB pertumbuhan bundle mentah; tes interaksi browser tetap menjadi cakupan P1-13. |
| P1-15 Bobot pendukung bukan dari workbook | ✅ **Diputuskan 6 Sep 2026 — cara (a) disahkan.** Bobot pendukung tetap 30% dibagi rata ke seluruh pendukung yang dipakai (`FLAG_DIPAKAI = true`), dua desimal, selisih pembulatan ke pendukung terakhir. Dasar: setiap pekerjaan yang dicatat dan dibuktikan harus menambah capaian; cara (b) menghanguskan pekerjaan nyata semata-mata karena posisi barisnya di katalog. | ✅ Selesai | Divergensi terhadap workbook pada 25 subkegiatan kini berstatus **kebijakan tercatat**, bukan temuan — audit berikutnya tidak perlu membukanya lagi. Keputusan lengkap beserta tabel dampak: `../keputusan-terbuka.md` §2b. Konsekuensi yang diterima: beban antarbidang tidak setara (23 pendukung vs 3 untuk sama-sama 100%); jalur perbaikannya menyunting katalog, bukan mengubah rumus. Tidak ada perubahan kode — algoritma aktif sudah sesuai keputusan. |
| P1-17 Fitur tanpa cakupan audit | ✅ **Ditutup 10 September 2026.** Kalender Rencana + agenda, Penunjukan Bidang, `FLAG_DIPAKAI`, dan reset & ganti password diaudit penuh terhadap workbook dan keputusan bisnis yang berlaku — tidak ada penyimpangan angka capaian. | ✅ Selesai | Rincian per fitur: `../audits/audit-menyeluruh-2026-09-06.md` §A-05. Dua celah non-capaian yang ditemukan selama audit dibuka sebagai tiket tersendiri: **P1-18** (sesi/token tidak dicabut saat reset password) dan **P2-14** (race condition pindah/lepas rencana). Kebijakan "bidang seragam per kegiatan tetap warning-only" dicatat di `../keputusan-terbuka.md` §2e. Cakupan tes ditambah pada 7 file (BE+FE) untuk menutup celah yang ditemukan selama audit ini. |
| P1-18 Reset/ganti password tidak mencabut sesi lain | **Dilanjutkan sebagai P0-R01** (dinaikkan ke P0 pada 1 Okt 2026 setelah terbukti juga berlaku pada jalur nonaktifkan pengguna; status berjalan ada di baris P0-R01, baris ini tidak dihitung lagi). **Temuan baru 10 September 2026**, ditemukan saat audit A-05 (P1-17). `PenggunaController::resetPassword()` dan `AuthController::gantiPassword()` mengganti `password` tapi tidak memanggil `tokens()->delete()` atau membatalkan sesi `web` aktif milik user target/diri sendiri. | ➡️ Dipindah | Sengaja tidak diperbaiki bersamaan dengan A-05 (keputusan cakupan orchestrator). Perbaikannya: panggil `$user->tokens()->delete()` (dan bila target diri sendiri, jangan hapus `currentAccessToken()` sebelum response selesai) di kedua controller, di dalam `DB::transaction()` yang sama dengan penggantian password. Rincian: `../audits/audit-menyeluruh-2026-09-06.md` §A-05. |

### P2 — Kelengkapan operasional

| Tiket                             | Respons implementasi saat ini                                                                                                                                                                                                                                                                                                                                                                                                  | Status     | Tindakan berikutnya                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2-01 Import Excel                | Preview dan import final create-only memakai parser kanonik yang mempertahankan `Programmed`. Workbook resmi harus tepat 5 program, 20 kegiatan, 78 subkegiatan, 439 aktivitas, serta tujuh bidang sumber. Template hanya menerima tujuh bidang itu dan menolak nama program/kegiatan maupun metadata subkegiatan yang tidak konsisten pada kode yang sama. | ✅ Selesai | `OperaInkSeederTest` menguji preview/import resmi dan output hingga laporan, konflik kode tanpa pembuatan dokumen parsial, template invalid tanpa data tersimpan, serta penolakan admin bidang (**4 tes, 45 assertion lulus**). |
| P2-02 Tren antarperiode           | Endpoint `GET /dashboard/tren` menyediakan hingga enam periode OPEN/LOCKED sampai periode terpilih. Nilai memakai rerata capaian subkegiatan yang sama dengan dashboard; admin aplikasi melihat perangkat daerah, admin bidang hanya bidang miliknya. Dashboard Umum menampilkan visual batang per periode, capaian, status, dan jumlah subkegiatan.                                                                           | ✅ Selesai | Ditutup oleh tes endpoint tren, pembatasan scope admin bidang, dan build frontend.                                                                                                                                                                                                                                                         |
| P2-03 Bukti realisasi             | Bukti foto/dokumen dapat diunggah, ditampilkan dalam galeri, dipratinjau/diunduh, dan dihapus dari layar Bukti Kegiatan. Dialog pratinjau kini memiliki `DialogDescription` agar nama dan fungsi dialog terbaca oleh teknologi asistif tanpa peringatan Radix. Backend menolak penghapusan bukti terakhir dan menghapus file privat beserta rekamannya secara aman. | ✅ Selesai | Diverifikasi oleh tes CRUD lampiran, akses pratinjau, dan kasus penghapusan bukti terakhir; lint dan production build frontend lulus setelah koreksi aksesibilitas dialog. |
| P2-04 Sesi kedaluwarsa            | Respons 401 tetap membersihkan sesi dan kini menampilkan `AlertDialog` bawaan template dengan judul **Sesi berakhir**, penjelasan, dan aksi **Masuk kembali**. Setiap login sukses tetap diarahkan ke `/dashboard`; state halaman asal dan redirect tersimpan dibersihkan setelah autentikasi. | ✅ Selesai | Tes komponen event `opera:unauthorized` dan penutupan dialog lulus (**1 tes**); lint dan production build frontend lulus. Login baru maupun pengguna bersesi yang membuka `/login` tetap memakai tujuan tunggal `/dashboard`. |
| P2-05 Pemulihan pengguna          | Endpoint `PATCH /pengguna/{id}/pulihkan` kini memulihkan akun soft-deleted, mempertahankan relasi bidang serta jejak realisasi, dan mencatat log `PULIHKAN`. Tombol Aktifkan pada Manajemen Pengguna kini memanggil endpoint tersebut.                                                                                                                                                                                         | ✅ Selesai | Diverifikasi oleh tes pemulihan akun nonaktif dan build frontend.                                                                                                                                                                                                                                                                          |
| P2-06 Empty state                 | `CatatRealisasi` dan `BuktiKegiatan` kini menangkap kegagalan saat memuat periode/bidang maupun data periode. Keduanya menampilkan pesan galat yang tidak tertukar dengan empty state dan tombol **Coba lagi**; retry memuat ulang bootstrap bila periode belum tersedia, atau data periode aktif bila sudah tersedia.                                                                                                         | ✅ Selesai | Diverifikasi melalui build frontend TypeScript/Vite. Error API (termasuk 401/403/422/500 atau jaringan) dipetakan lewat `apiMessage`, sehingga pengguna menerima pesan respons dan dapat mencoba kembali tanpa reload halaman.                                                                                                             |
| P2-07 Detail indikator            | Rincian subkegiatan konsisten menampilkan indikator, target/satuan, output, aktivitas, bobot, catatan, lampiran, dan pencatat. Drill-down Capaian Program mencocokkan snapshot terhadap master termasuk data nonaktif agar periode historis tidak menghasilkan request `/kegiatan/0`; kegagalan rincian ditangani di UI. | ✅ Selesai | Tes regresi memastikan kegiatan historis memperoleh ID master dan ID nol tidak memicu request (**2 tes lulus**); lint dan production build frontend lulus. Detail bukti tetap memakai endpoint berotorisasi. |
| P2-08 Koreksi/hapus realisasi     | Layar Catat Realisasi kini menyediakan tombol Riwayat pada setiap aktivitas. Admin bidang dapat mengoreksi tanggal, jumlah bilangan bulat, dan keterangan; pratinjau menunjukkan total aktivitas sebelum/sesudah koreksi. Hapus memerlukan konfirmasi dan menjelaskan bahwa bobot/capaian akan dihitung ulang. Aksi disembunyikan dari peran baca dan dinonaktifkan di luar periode OPEN.                                      | ✅ Selesai | UI memakai `PUT`/`DELETE /realisasi-kegiatan/{id}`. Backend telah menegakkan kepemilikan bidang, periode OPEN, bukti minimal, recalculation capaian, dan audit log. Tes `RealisasiTest` lulus **14 tes, 56 assertion**; build frontend TypeScript/Vite lulus.                                                                              |
| P2-09 Metadata riwayat pencatatan | `TransAktifitasBidang` kini menyediakan agregat `jumlah_catatan` dan `jumlah_lampiran`. Endpoint `bidang-saya/rencana` eager-load catatan dan lampiran sekali untuk seluruh aktivitas periode; mapper pencatatan memakai agregat tersebut, sedangkan layar Bukti memetakan data yang sama tanpa request per aktivitas.                                                                                                         | ✅ Selesai | Tes endpoint memastikan satu catatan dan satu lampiran muncul sebagai agregat sekaligus detail pada respons rencana. `RealisasiTest` lulus **15 tes, 62 assertion**; build frontend TypeScript/Vite lulus.                                                                                                                                 |
| P2-10 Cap 100% tak terdokumentasi | Kebijakan aplikasi disahkan 6 September 2026: realisasi aktual di atas target tetap disimpan, tetapi kontribusinya dibatasi pada `BOBOT_TARGET` dan capaian subkegiatan dibatasi 100%. Dialog konfirmasi secara eksplisit menjelaskan bahwa kelebihan tidak menambah capaian. | ✅ Selesai | `CapaianServiceTest` membuktikan realisasi 250% hanya menghasilkan bobot realisasi sebesar bobot target. Tes dialog mengunci teks kebijakan, nilai aktual, fokus aksi aman, pembatalan, dan konfirmasi simpan. Keputusan beserta konsekuensinya dicatat di `../keputusan-terbuka.md` §2c. |
| P2-11 Endpoint backend tanpa layar | **Selesai 2 Okt 2026.** Layar Periode kini menampilkan snapshot `GET /periode/{id}/capaian` untuk periode OPEN/LOCKED dan menyediakan aksi terkonfirmasi `POST /periode/{id}/hitung-ulang` sebagai alat pemulihan; angka langsung diperbarui dari respons dan kegagalan satu snapshot tidak menggagalkan daftar periode. Rencana Saya memakai `GET /bidang-saya/riwayat` untuk hanya menawarkan periode LOCKED yang benar-benar mempunyai arsip bidang pengguna. Empat endpoint publik granular tetap API-only secara sengaja: layar publik memakai payload gabungan `/public/landing` dan `/public/bidang/{id}`. `POST /program/{id}/turunkan` tetap API-only dan tidak dipasang ke UI selama keputusan hierarki P1-12 ditangguhkan | ✅ Selesai | Tes service/UI baru mencakup mapping snapshot, request hitung ulang, pembaruan `65,39% → 70,00%`, konfirmasi, serta deduplikasi periode riwayat. FE **24 berkas / 174 tes lulus**, lint nol peringatan, TypeScript dan build produksi lulus; gerbang BE tetap **268/268 tes, 1.382 asersi lulus** |
| P2-12 Satuan & output kinerja nyaris kosong | Opsi A disahkan 6 Sep 2026: nilai sumber yang tersedia tetap dipakai; nilai kosong tidak ditebak dan ditampilkan eksplisit sebagai **“Satuan belum tersedia pada sumber”** atau **“Output belum tersedia pada sumber”** di UI serta CSV. Workbook dan database tidak diubah. | ✅ Selesai | Helper frontend menangani `null`, string kosong, dan spasi-only secara konsisten pada metadata subkegiatan. Ekspor rincian menerapkan kontrak yang sama. Vitest helper **9 tes lulus**; seluruh frontend **17 berkas/134 tes**, lint nol-warning, dan build lulus; `DashboardLaporanTest` **11 tes/55 asersi lulus**, termasuk kedua placeholder CSV. Keputusan dicatat di `../keputusan-terbuka.md` §2d. |
| P2-13 Token API menumpuk tanpa dipakai | `AuthController::login` kini membedakan mode autentikasi: request SPA yang mempunyai sesi hanya menerima data pengguna dan cookie sesi, sedangkan request non-browser tanpa sesi tetap memperoleh `data.token` untuk Bearer. Login SPA tidak lagi membuat kredensial persisten yang tidak dipakai frontend. | ✅ Selesai | `AuthTest` membuktikan login SPA tidak memuat `data.token`, tidak menambah baris `personal_access_tokens`, dan tetap dapat mengakses `/me` melalui sesi; mode Bearer serta pencabutan token saat logout tetap lulus. **7 tes, 29 asersi lulus**; suite backend 512 MB: **213 tes, 1106 asersi lulus**. Sebanyak 24 token lama tidak dihapus otomatis agar klien API yang sah tidak terputus; pembersihannya merupakan tindakan operasional terpisah. |
| P2-14 Race condition (TOCTOU) pada pindah-bidang & lepas rencana | **Selesai 2 Okt 2026.** `pindahBidang()` dan `destroy()` kini mengunci periode lalu baris rencana dalam satu transaksi sebelum membaca ulang status, memeriksa realisasi, dan melakukan mutasi. Jalur pencatatan realisasi mengambil lock yang sama dengan urutan periode → rencana → aktivitas, lalu memvalidasi ulang kepemilikan bidang dan status periode; dengan demikian lock sisi admin aplikasi benar-benar bersinggungan dengan penulis realisasi, bukan hanya menyerialisasi dua aksi pindah/lepas. Pembukaan periode sudah memakai lock periode yang sama | ✅ Selesai | Regresi fault-injection membuktikan pindah dan lepas di-rollback bila langkah sesudah mutasi gagal. Suite penyusunan+realisasi **77 tes / 368 asersi lulus**; `pint --test` lulus; `composer test:gerbang` **268/268 tes, 1.382 asersi lulus** |

### P3 — Konsistensi teknis dan istilah

| Tiket                   | Respons implementasi saat ini                                                                                                                                                                                                                                                                                                                                   | Status     | Tindakan berikutnya                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3-01 Token desain      | `index.css` kini mendefinisikan token semantic/domain untuk brand, status, surface, border, teks, dan palet chart. Source route produksi memakai token tersebut untuk dialog, chart/SVG, dan surface layout; `design-tokens.ts` menjadi satu sumber nilai JavaScript/SVG.                                                                                       | ✅ Selesai | Audit literal pada Landing, Login, Detail, dan DashboardLayout tidak lagi menemukan nilai hex. Build frontend TypeScript/Vite lulus; peringatan ukuran bundle tetap terpisah dari token desain. |
| P3-02 Istilah aktivitas | Semua label pengguna pada route produksi memakai “aktivitas”, termasuk master, rencana, monitoring, capaian, realisasi, detail, bobot, pencarian, dan label aksesibilitas. Identifier teknis `aktifitas` (route, properti API, tipe, dan model) sengaja dipertahankan demi kompatibilitas kontrak.                                                              | ✅ Selesai | Audit source UI memastikan sisa `aktifitas` pada lapisan aktif adalah identifier teknis atau interpolasi properti API, bukan label pengguna. Build frontend TypeScript/Vite lulus.              |
| P3-03 Quality gate lint | Scope lint dibatasi pada source produksi `src`, sedangkan `dist`, bundle duplikat, patch, mock, dan halaman legacy yang tidak terdaftar oleh router dikecualikan. Sisa error source aktif diperbaiki; pengecualian rule hanya dipakai untuk boundary API lama, pola export shadcn/provider, lifecycle pemulihan state, dan React Hook Form yang terdokumentasi. | ✅ Selesai | `npm run lint` lulus tanpa error/warning; `npm run build` juga lulus. Peringatan ukuran bundle Vite (sekitar 1,22 MB) tetap muncul sebagai optimasi performa terpisah, bukan kegagalan lint.    |
| P3-04 Stabilitas runner tes backend | Script `composer test` kini menjalankan `vendor/bin/phpunit` dengan `memory_limit=512M`, sehingga quality gate tidak lagi bergantung pada batas PHP default 128 MB. Audit cleanup/fixture untuk menurunkan konsumsi memori dicatat sebagai optimasi terpisah. | ✅ Selesai | `composer test` lulus **214 tes / 1130 asersi** dalam sekitar 8 detik. Percobaan `artisan test` dengan flag pemanggil membuktikan flag tidak diteruskan ke proses PHPUnit; script langsung menjadi kontrak runner yang eksplisit. |
| P3-05 Regresi lint | `namaBidang` kini distabilkan dengan `React.useCallback([bidangs])`, dan `useMemo` penyaring pengguna bergantung pada callback tersebut. Dependency mencerminkan nilai yang benar-benar dipakai tanpa mengubah perilaku pencarian/filter. | ✅ Selesai | Tes `ManajemenPengguna` lulus **2 tes**; `npm run lint -- --max-warnings=0` lulus tanpa error maupun warning; `npm run build` lulus. Peringatan ukuran chunk Vite tetap dicatat terpisah sebagai masalah performa, bukan lint. |
| P3-06 Kode mati di pohon produksi | ✅ Pohon frontend produksi telah dibersihkan: 16 halaman legacy tak-terdaftar, seluruh `src/mocks/`, `mock-client.ts`, tiga skrip patch sekali pakai, salinan bundle, dan hasil build dihapus. `.gitignore` kini melindungi `dist/` dan `opera-ink-fe-bundle/`. **Dilanjutkan 1 Okt 2026 dengan persetujuan eksplisit pengguna:** kedua backend lama di akar workspace dihapus — `bapperrida-laravel13/` (195 MB) dan `opera-backend/` (144 KB). | ✅ Selesai | Tidak ada lagi impor ke jalur legacy; `npm test` lulus **16 berkas / 125 tes**, lint nol-warning dan build lulus. Verifikasi penghapusan 1 Okt 2026: `bapperrida-laravel13` working tree bersih dan kedua branch (`main`, `revisi`) sudah terpush ke `github.com/Ahadiyatr/BE_BAPPERIDA`, jadi dapat di-clone ulang. `opera-backend` bukan repo git, karena itu 30 berkasnya dibandingkan lebih dulu terhadap `BE-opera` (15 identik, 13 sudah berkembang di `BE-opera`, 2 memang dihapus menyusul keputusan "bidang tanpa bobot" 29 Agu 2026) dan tiga dokumennya yang tak tergantikan — `flow.md`, `ERD.md`, `README.md` — diarsipkan ke `BE-opera/docs/opera-backend-asal/` beserta `CATATAN.md`; rujukan ke `flow.md` di `BE-opera/docs/{roadmap,frontend-integration}.md` dan `docs/plans/rencana-bidang.md` diarahkan ke lokasi baru. Keduanya dipindahkan ke Trash, bukan dihapus paksa, karena `bapperrida-laravel13/.env` hanya ada secara lokal. Rincian temuan asal: [`../audits/audit-menyeluruh-2026-09-06.md`](../audits/audit-menyeluruh-2026-09-06.md) §C-01. |
| P3-07 Pembersihan periode DRAFT (semula P1-16) | **Selesai 2 Okt 2026.** Layar Periode kini memetakan `jumlah_subkegiatan_bidang` dari API dan hanya menawarkan **Hapus** untuk periode `DRAFT` dengan jumlah rencana tepat nol. Dialog menjelaskan bahwa penghapusan permanen dan hanya berlaku bagi Draf tanpa pembagian rencana/capaian; aksi memanggil `DELETE /periode/{id}`, menampilkan hasil, lalu memuat ulang daftar. Backend tetap menjadi sumber kebenaran dan menolak bila status atau isi berubah setelah layar dimuat. Master lain tetap memakai jalur nonaktifkan/arsip yang sudah ada, bukan diberi tombol hapus yang hampir selalu ditolak | ✅ Selesai | Tes UI membuktikan penghapusan baru terjadi setelah konfirmasi dan memanggil ID yang benar; tombol tidak tersedia untuk DRAFT berisi, OPEN, atau LOCKED. FE **24 berkas / 176 tes lulus**, lint nol peringatan, TypeScript dan build produksi lulus; gerbang BE tetap **268/268 tes, 1.382 asersi lulus** |

---

## Riwayat audit

Catatan historis bagaimana tiket-tiket ini terbentuk dan ditutup, berurut dari delta
terbaru. Tidak diperbarui saat menutup tiket.

### Kesimpulan eksekutif per 10 September 2026

**Implementasi inti semakin dekat dengan workbook, tetapi belum dapat dinyatakan sesuai penuh — dan sejak 6 September 2026 alasannya berubah.** Artefak seed dan import interaktif kini sama-sama mempertahankan `Output Kinerja` dari sheet `Programmed`, dengan baseline sumber dan aturan template yang ditegakkan. Cakupan tes perilaku UI kini tersedia dan lulus (16 berkas, 125 tes).

Audit menyeluruh 6 September 2026 menutup dua penghalang lama (tes UI kini ada dan lulus 125 tes)
tetapi membuka penghalang baru yang belum pernah masuk daftar tiket: satu bug perhitungan capaian
yang dapat dipicu dari UI (P0-09) dan aturan bobot pendukung yang tidak berasal dari workbook
(P1-15). Rinciannya di [`../audits/audit-menyeluruh-2026-09-06.md`](../audits/audit-menyeluruh-2026-09-06.md).
Keduanya ditutup pada hari yang sama: **P0-09 diperbaiki** (`recalculateAktifitas()` kini dipanggil
untuk setiap pendukung setelah pembagi berubah, diverifikasi ulang lewat reproduksi HTTP yang sama),
dan **P1-15 diputuskan** — cara (a) 30/n disahkan sebagai kebijakan tercatat.

Ringkasan status terbaru atas 28 tiket awal, 6 tiket regresi/kelengkapan, dan 12 tiket hasil audit
menyeluruh 6-10 September 2026 (P0-09, P1-15, P1-17, P1-18, P2-10…P2-14, P3-05…P3-07):

Ditambah 15 tiket baru dari audit kesiapan produksi 1 Oktober 2026 (P0-R02…P0-R04, P1-R01…P1-R07,
P2-R01…P2-R05), serta P1-18 yang dinaikkan menjadi **P0-R01** karena dampaknya keamanan akses.
Per 1 Oktober 2026, dua di antaranya ditutup: **P0-R04** (template konfigurasi produksi) dan
**P1-R01** (pembekuan komposisi pendukung saat periode dibuka).

Di luar 28 tiket tersebut, keputusan lanjutan untuk **menghapus bobot bidang** sudah dilaksanakan secara konsisten dan sesuai dengan workbook, karena workbook tidak mempunyai angka atau rumus bobot antarbidang.

> **Delta 1 Oktober 2026.** Kesesuaian dengan workbook dan kebenaran angka capaian **tetap tertutup** —
> audit kesiapan produksi tidak membuka satu pun temuan di sana. Yang berubah: sistem dinilai
> **belum siap produksi** karena empat penghalang P0 yang seluruhnya bersifat keamanan dan
> konfigurasi lingkungan, bukan kebenaran angka. Rincian, bukti, dan urutan pengerjaan ada di
> [`audit-kesiapan-produksi-2026-10-01.md`](../audits/audit-kesiapan-produksi-2026-10-01.md).

Status umum sebelum delta 1 Oktober: **seluruh P0 tertutup, seluruh P1 selesai/diputuskan kecuali P1-18 (baru dibuka).** P0-09 diperbaiki dan diverifikasi ulang, P1-15 diputuskan (30/n disahkan), P1-17 ditutup dengan audit kesesuaian penuh atas empat fitur. Yang tersisa bersifat kelengkapan operasional dan hardening keamanan, bukan kebenaran angka: tombol hitung ulang sebagai jaring pengaman (P2-11), sesi/token tidak dicabut saat reset password (P1-18), race condition pindah/lepas rencana (P2-14), runner tes backend standar (P3-04, selesai), dan pembersihan periode DRAFT (P3-07).

## Delta Audit Susulan — 3 Oktober 2026

Audit mencari temuan pada dimensi yang belum pernah disentuh enam audit sebelumnya:
kebijakan kata sandi di seluruh jalur, keamanan unggahan dan penyajian berkas, open redirect,
mass assignment, batas paginasi, kepercayaan reverse proxy, dan pertumbuhan tabel jejak audit.

Laporan lengkap beserta reproduksi dan bukti per temuan:
[`audit-susulan-2026-10-03.md`](../audits/audit-susulan-2026-10-03.md).

| Tiket | Temuan | Status | Bukti |
| --- | --- | --- | --- |
| **P1-R08** Kebijakan kata sandi tidak seragam dan membatalkan sebagian P0-R03 | Kebijakan dipusatkan di `KebijakanKataSandi`: minimal 12 karakter serta wajib huruf dan angka. Pembuatan pengguna, reset manual, ganti sandi sendiri, dan `opera:buat-admin` memakai aturan yang sama; validasi dan petunjuk frontend ikut diselaraskan | ✅ Selesai | Test terfokus backend **32 lulus**; test frontend terkait **8 lulus**; gerbang backend **270 lulus / 1.402 assertion**; seluruh frontend **176 lulus**, lint dan build hijau |
| **P1-R09** `TrustProxies` tidak dikonfigurasi, membuat pembatas laju P0-R02 kehilangan makna di produksi | `trustProxies` dan header `X-Forwarded-*` dikonfigurasi, sedangkan IP/CIDR dibaca dari `TRUSTED_PROXIES` yang mendukung daftar dipisahkan koma dan tidak memiliki wildcard bawaan. Implementasi dan isolasi throttle sudah terverifikasi; alamat proxy nyata masih harus diisi serta diperiksa saat deployment | ⚠️ Sebagian | Test membuktikan proxy tepercaya menghasilkan IP klien dan HTTPS, pengirim tak tepercaya tidak dapat memalsukannya, serta dua IP di belakang proxy mempunyai kuota login terpisah. Gerbang backend **270 lulus / 1.402 assertion**; verifikasi server produksi menunggu CIDR nyata |
| **P3-R01** Tabel jejak audit tumbuh tanpa retensi | `TRANS_LOG_AKTIVITAS` tidak punya pemangkasan maupun arsip, dan P1-R04 baru menambah laju pertumbuhannya dengan mencatat login, gagal login, dan logout. Asimetris dengan log berkas yang sejak P2-R02 berotasi 14 hari. Jejak audit memang pantas disimpan lama, jadi yang kurang bukan pemangkasannya melainkan **kebijakan tertulisnya**: berapa lama disimpan, kapan diarsipkan, dan ke mana | ❌ Belum | `routes/console.php` hanya menjadwalkan hitung ulang capaian harian; tidak ada perintah pemangkasan |
| **P3-R02** Dua kebersihan kecil | (a) `.env.example` masih menyetel `FILESYSTEM_DISK=public` sementara `.env.production.example` sudah `local`. Tidak berbahaya hari ini karena `FileService` mematok disk `local` lewat konstanta, tetapi menyesatkan dan akan menjadi lubang bila konstanta itu kelak diganti agar mengikuti konfigurasi. (b) Respons pratinjau lampiran disajikan *inline* tanpa `X-Content-Type-Options: nosniff`; risikonya rendah karena tipe MIME dideteksi server dan aturan `image` menolak SVG, tetapi nosniff murah sebagai lapis kedua | ❌ Belum | `.env.example` baris `FILESYSTEM_DISK`; tidak ada header keamanan yang disetel aplikasi |

### Yang diperiksa dan terbukti kokoh

Bagian ini dicatat supaya audit berikutnya tidak mengulang pekerjaan yang sama:

- **SVG ditolak** aturan `image` Laravel 13 (hanya diterima bila `allow_svg` dipasang), sehingga
  stored XSS lewat unggahan gambar tertutup di tingkat framework.
- **Batas unggahan ada**: foto `image|max:10240`, dokumen `file|mimes:pdf,doc,docx,xls,xlsx|max:20480`.
- **Open redirect tertutup rapi**: `normalkanTujuanLogin()` menolak `//`, backslash, karakter
  kontrol, origin luar, dan `/login` — salah satu bagian yang paling teliti di repo ini.
- **Tidak ada mass assignment**: nol pemakaian `$request->all()` pada `create`/`update`/`fill`.
- **Pengguna nonaktif tidak bisa login**: `User` memakai `SoftDeletes`, sehingga global scope
  mengeluarkan baris terhapus dari query login.
- **Paginasi berbatas**: `max:1000`, `max:100`, dan `max:12` pada endpoint daftar.
- **Nama berkas unggahan tidak dipercaya** sebagai nama simpan; `store()` membangkitkan nama acak.

## Delta Audit Kesiapan Produksi — 1 Oktober 2026

Lingkup audit ini keamanan dan kesiapan operasional, bukan kesesuaian workbook. Bukti
lengkap tiap tiket ada di [`audit-kesiapan-produksi-2026-10-01.md`](../audits/audit-kesiapan-produksi-2026-10-01.md);
kolom Bukti di bawah menyebut tes yang menjadi penanda tiket.

| Tiket | Temuan | Status | Bukti penanda |
| --- | --- | --- | --- |
| **P0-R01** Pencabutan kredensial tidak mencabut akses (semula P1-18, dinaikkan ke P0) | **Selesai 1 Okt 2026.** `PencabutanAksesService` baru memusatkan pencabutan untuk ketiga jalur: `AuthController::gantiPassword()` mencabut token dan sesi lain tetapi menyelamatkan sesi pelaku (dan menyegarkan `password_hash_web` supaya ia tidak terlempar keluar oleh aksinya sendiri); `PenggunaController::resetPassword()` dan `destroy()` mencabut seluruh token dan sesi korban. Pencabutan berjalan di dalam transaksi yang sama dengan penggantian kata sandi, jadi keduanya berlaku bersamaan atau tidak sama sekali. Sesi cookie SPA ikut dicabut dari tabel `sessions`, bukan hanya token Bearer yang diuji tes — jalur cookie adalah mode autentikasi yang sebenarnya dipakai aplikasi. Pesan sukses dan ringkasan jejak audit kini menyebut pencabutan itu, dan toast FE ikut memberitahu pengguna | ✅ Selesai | `composer test` **255 tes / 247 lulus** (dari 245); tiga tes `BE-P1-04` hijau. Empat asersi teks pada `GantiPasswordTest` dan `BidangPenggunaTest` disesuaikan karena pesan sukses dan ringkasan jejak audit berubah — bukan pelemahan asersi. FE **171 tes** lulus, lint nol peringatan, `pint --test` lulus |
| **P0-R02** 51 route tulis tanpa rate limit | **Selesai 2 Okt 2026.** `throttle:api` dipasang sekali pada grup route `v1` — satu tempat, bukan 51 tempelan, sehingga route baru otomatis ikut terbatas. Dua kuota bernama di `AppServiceProvider::daftarkanPembatasLaju()`: `api` 120/menit untuk pemakaian umum dan `berat` 10/menit untuk lima operasi yang menyentuh seluruh katalog (`import/excel`, `import/excel/preview`, `hitung-ulang`, `salin-rencana`, `laporan/export`). Keduanya dihitung **per pengguna** (jatuh ke IP bila belum login) supaya satu bidang yang sibuk tidak memakan kuota bidang lain. Respons 429 diterjemahkan ke bahasa Indonesia dan menyebut tenggang, serta mempertahankan header `Retry-After` — sebelumnya "Too Many Attempts." tanpa tenggang. Throttle sengaja TIDAK dipasang di grup middleware kernel: di sana ia tak terlihat oleh audit route, dan bila dipasang bersamaan kuota yang sama terhitung dua kali | ✅ Selesai | `composer test` **258 tes / 251 lulus** (dari 247). Tes audit `BE-P2-10` hijau, plus `BatasLajuTest` baru (3 tes) yang membuktikan pembatasnya benar-benar menolak — audit lama hanya membuktikan middleware terpasang, bukan kuotanya benar: penolakan 429 pada panggilan ke-11, route biasa tetap lolos 11 kali, dan kuota satu pengguna tidak mengenai pengguna lain. `pint --test` lulus |
| **P0-R03** Kata sandi `password` tertanam di seeder untuk 16 akun, 2 di antaranya `admin_aplikasi` | **Selesai 2 Okt 2026.** Empat lapis: (1) `UserSeeder` menolak jalan di luar environment `local`/`testing` — dibandingkan ke daftar yang diizinkan, bukan menolak `production` saja, supaya staging/demo aman secara bawaan; (2) perintah baru `php artisan opera:buat-admin` jadi jalur resmi akun admin produksi — interaktif dengan kata sandi tersembunyi, `--generate` untuk kata sandi acak, atau `OPERA_ADMIN_PASSWORD` untuk deploy non-interaktif; kata sandi sengaja tidak diterima sebagai argumen karena argumen tampak di daftar proses dan riwayat shell; minimal 12 karakter huruf+angka; (3) README berhenti mempublikasikan kata sandi universal dan mengarahkan ke perintah itu; (4) tiga dump SQL dikeluarkan dari pelacakan git dan pola `*.sql` masuk `.gitignore` — berkasnya tetap ada di disk. **Ditemukan saat pengerjaan:** `Login.tsx` masih memuat panel "Info Login Developer" berisi 8 akun DAN mengisi kolom email+kata sandi otomatis dengan kredensial admin yang berfungsi, sehingga siapa pun yang membuka layar login cukup menekan Masuk. Seluruh blok itu dikurung `import.meta.env.DEV` dan prefill dikosongkan | ✅ Selesai | `composer test` **263 tes / 256 lulus** (dari 251), termasuk `BuatAdminCommandTest` baru (5 tes: env, kata sandi lemah ditolak, surel ganda ditolak, `--generate`, dan pagar seeder di `production`). FE **171 tes** lulus, lint nol peringatan, build lulus. Bukti panel dev benar-benar terbuang: `grep -c "bapperida.test" dist/assets/*.js` → **0**. `pint --test` lulus. Lima tes `Login.test.tsx` disesuaikan karena kini harus mengisi kredensial sendiri — persiapan, bukan asersi, yang berubah |
| **P0-R04** Tidak ada template konfigurasi produksi | **Selesai 1 Okt 2026.** `BE-opera/.env.production.example` dibuat: `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true`, `LOG_STACK=daily` + `LOG_DAILY_DAYS=14`, `LOG_LEVEL=warning`, `FILESYSTEM_DISK=local`, `DB_USERNAME` bertanda bukan-root, plus syarat domain cookie Sanctum, daftar langkah deploy, kebutuhan cron scheduler dan queue worker, izin berkas, serta larangan `db:seed` di produksi yang menunjuk P0-R03. README menunjuk template ini. Catatan eksplisit bahwa `APP_TIMEZONE` di env tidak berpengaruh sampai P1-R05 dikerjakan, supaya tidak dianggap selesai | ✅ Selesai | `git check-ignore` memastikan `.env.production.example` ikut terlacak sementara `.env.production` tetap diabaikan (`.gitignore:5`) · nilai kerasnya diverifikasi terhadap `config/session.php:172`, `config/logging.php`, `config/filesystems.php:35` |
| **P0-R05** Edit pengguna dapat mengganti password tanpa mencabut akses lama | **Selesai 3 Okt 2026.** Jalur duplikat pada `PUT/PATCH /pengguna/{id}` ditutup: `UpdatePenggunaRequest` menolak field `password` dengan 422 dan controller tidak lagi menulis password dari edit profil. Perubahan password kini hanya dapat melewati dua endpoint khusus — reset oleh admin dan ganti sendiri — yang sudah mencabut sesi/token dalam transaksi yang sama. FE tidak perlu diubah karena edit profil memang tidak pernah mengirim password dan dialog reset sudah memakai endpoint khusus | ✅ Selesai | Regresi membuktikan edit nama/email/bidang tetap berhasil, request edit yang menyisipkan password ditolak, dan hash tidak berubah. Tes password terarah **14 tes / 48 asersi lulus**; Pint lulus; gerbang BE **268/268 tes, 1.384 asersi**; FE **24 berkas / 176 tes** dan build produksi lulus |
| **P1-R01** Capaian tercatat berubah surut pada periode OPEN | **Selesai 1 Okt 2026.** Ternyata bukan keputusan baru: aturan DRAFT-only sudah ada sejak 2 Sep 2026 dan hanya ditegakkan pada 1 dari 4 jalur. Kebijakan dibakukan sebagai `../keputusan-terbuka.md` §2f, lalu `AktifitasBidangController` ditegakkan — `store()`, `update()`, dan `destroy()` kini menolak 422 bila periode bukan `DRAFT`. Docblock kelas memuat keputusannya beserta peringatan agar tidak dilonggarkan tanpa keputusan pengganti. Tidak ada fitur pengguna yang hilang: FE sudah DRAFT-only di semua layar | ✅ Selesai | `composer test` **255 tes / 244 lulus** (dari 242) — `BE-P1-02` tertutup dua sisi. `BE-P1-03` (`test_ubah_target…`) disesuaikan persiapannya saja: ad-hoc dibuat saat `DRAFT` lalu periode dibuka, pernyataan ujinya tidak diubah. `vendor/bin/pint --test` lulus; FE **171 tes** tetap lulus |
| **P1-R02** Rollback hapus lampiran menghilangkan berkas | **Selesai 2 Okt 2026.** `FileService::hapusLampiran()` menunda penghapusan berkas sampai transaksi pemanggil benar-benar commit, lewat `DB::afterCommit()`. Prinsipnya: basis data bisa di-rollback, disk tidak — jadi disk yang mengalah dan menunggu. Pemeriksaan "masih ada baris lain menunjuk path ini?" ikut pindah ke dalam callback, sehingga yang dinilai adalah keadaan basis data setelah commit, bukan keadaan sementara di tengah transaksi. Jalur pemanggil yang tidak bertransaksi tetap menghapus saat itu juga karena `afterCommit` berjalan segera bila tidak ada transaksi aktif | ✅ Selesai | `test_hapus_lampiran_yang_rollback_tidak_menghilangkan_berkas` hijau. Sisi sebaliknya tetap terjaga: dua asersi `Storage::assertMissing` di `RealisasiTest` membuktikan berkas memang terhapus pada penghapusan yang berhasil — 26 tes `RealisasiTest` lulus. Suite penuh **263 tes / 260 lulus** (dari 259). `pint --test` lulus |
| **P1-R03** Ekspor CSV tidak menetralkan rumus | **Selesai 2 Okt 2026.** `LaporanController::baris()` adalah satu-satunya titik yang menulis sel, jadi netralisasi dipasang di sana dan otomatis berlaku untuk kedua jenis laporan serta kolom yang ditambahkan nanti. Sel teks yang diawali `=`, `+`, `-`, `@`, tab, atau CR diberi petik tunggal. Angka dilewati supaya kolom capaian tetap terbaca sebagai angka di Excel, bukan berubah jadi teks yang tidak bisa dijumlah | ✅ Selesai | `test_ekspor_csv_menetralkan_rumus_buatan_pengguna` hijau — 34 asersi menyisir setiap sel pada seluruh baris CSV |
| **P1-R04** Jejak audit tidak mencatat peristiwa keamanan | **Selesai 2 Okt 2026.** Tiga celah ditutup: (1) kosakata `TransLogAktivitas::AKSI` ditambah `PULIHKAN`, `LOGIN`, `GAGAL_LOGIN`, `LOGOUT` — `PULIHKAN` sebelumnya ditulis oleh `restore()` tetapi tidak ada di kosakata, sehingga barisnya tercatat namun filter `?aksi=PULIHKAN` menolaknya 422; (2) `AuthController` mencatat login berhasil, login gagal, dan logout — login gagal memakai override `pelaku` karena belum ada sesi, surel yang dicoba masuk ke ringkasan, kata sandi tidak pernah tercatat, dan `throttle:6,1` menjaga tabel log tidak bisa dibanjiri lewat jalur itu; logout dicatat di awal selagi pelaku masih terbaca sebelum sesi dibongkar; (3) `hitungUlang()` mencatat jejak sesudah perhitungan berhasil dengan `PERIODE_ID` dan jumlah bidang terdampak | ✅ Selesai | **`composer test` 263 tes / 263 lulus — suite backend hijau sepenuhnya, papan skor tiket kosong.** FE 171 tes lulus, build lulus, `pint --test` lulus pada berkas yang disentuh |
| **P1-R05** Zona waktu aplikasi UTC sementara pengguna WITA | **Selesai 2 Okt 2026; zona dikoreksi 2 Okt 2026 sesuai lokasi pengguna.** `config/app.php` membaca `env('APP_TIMEZONE', 'Asia/Makassar')`, tidak lagi mematok `UTC`. `APP_TIMEZONE` disamakan pada template lingkungan umum dan produksi, beserta peringatan agar tidak dikembalikan ke UTC. Yang menentukan: kolom bisnis `TANGGAL_KEGIATAN`, `TANGGAL_MULAI`, `TANGGAL_SELESAI` bertipe `date` murni, sehingga dengan UTC realisasi dini hari WITA dapat tersimpan sebagai hari sebelumnya | ✅ Selesai | `test_zona_waktu_aplikasi_mengikuti_pengguna` mengunci `Asia/Makassar`. **Perlu tindakan operasional:** 16 pasang `CREATED_AT`/`UPDATED_AT` lama tertulis sebagai UTC, jadi ada diskontinuitas 8 jam pada jejak audit di titik peralihan — lihat catatan di atas |
| **P1-R06** Target di luar kapasitas kolom diterima | **Selesai 2 Okt 2026.** `App\Support\BatasKolom::aturanTarget()` memusatkan batas `max:9999999999999.99` yang terikat pada definisi `decimal(15,2)`, dipakai keempat aturan target yang ada (`UpdateRencanaRequest` dua kali, `StoreAktifitasBidangRequest`, `UpdateAktifitasBidangRequest`). Dipusatkan supaya batas dan definisi kolom tidak bisa melenceng diam-diam | ✅ Selesai | `test_target_di_luar_kapasitas_kolom_ditolak` hijau — `1e18` kini 422, sebelumnya 200 |
| **P1-R07** Dependensi rentan | **Selesai 2 Okt 2026.** `league/commonmark` 2.10.0 → **2.10.3** (menutup DoS *high* dan bypass *medium*), `laravel/framework` → **v13.34.0** (menutup XSS halaman debug), dan `npm audit fix` untuk `fast-uri` | ✅ Selesai | `composer audit --no-dev --locked` → "No security vulnerability advisories found". `npm audit --omit=dev` → "found 0 vulnerabilities". Kedua suite tetap hijau sesudah update |
| **P2-R01** Tidak ada CI | **Selesai 2 Okt 2026.** `.github/workflows/ci.yml` di kedua repo, jalan pada setiap push dan pull request. **BE:** `composer validate --strict`, `composer test:gerbang`, pint pada berkas yang berubah, `composer audit`, matriks PHP 8.3 + 8.4 (8.3 adalah batas bawah composer.json); tidak perlu layanan MySQL karena tes memakai sqlite `:memory:`. **FE:** `npm ci`, lint `--max-warnings=0`, `tsc -b`, tes, build produksi, plus pagar khusus yang menggagalkan build bila akun developer ikut terbit ke `dist/` — menangkap kembalinya kesalahan P0-R03 yang pernah lolos dari dua audit. Dua job sengaja tidak memblokir: papan skor tiket dan `npm audit`, karena advisory baru di hulu bukan kesalahan pull request yang sedang jalan. Pint tidak dijalankan repo-wide: 21 berkas lama belum sesuai, 13 di antaranya di `app/Models` yang memang sengaja dikecualikan — gerbang yang selalu merah akan diabaikan | ✅ Selesai | Kedelapan perintah gerbang dijalankan lokal lebih dulu dan semuanya lulus, jadi CI hijau sejak push pertama: BE 263/263 tes, `composer validate` valid, `composer audit` bersih, pint lulus pada 12 berkas yang berubah; FE lint nol peringatan, `tsc -b` exit 0, 171 tes, build lulus, `dist/` bersih dari akun developer |
| **P2-R02** Log tanpa rotasi, level debug | **Selesai 2 Okt 2026.** Template lingkungan umum kini memakai stack `daily` dengan retensi 14 hari dan level minimum `info`, sehingga instalasi yang tidak memakai template produksi juga tidak lagi menumbuhkan satu berkas log tanpa batas atau mencatat detail debug secara bawaan. Fallback di `config/logging.php` disamakan ke `daily`/`info`, jadi penghapusan variabel lingkungan tidak diam-diam mengembalikan perilaku lama. Template produksi tetap lebih ketat pada level `warning` | ✅ Selesai | Tes regresi konfigurasi **1 tes / 7 asersi lulus**; `pint --test` lulus; `composer test:gerbang` **264/264 tes, 1.371 asersi lulus** |
| **P2-R03** Probe kesehatan tidak memeriksa basis data | **Selesai 2 Okt 2026.** Endpoint bawaan `GET /up` dipertahankan dan kini listener `DiagnosingHealth` menjalankan kueri ringan `SELECT 1`. Probe baru berstatus sehat hanya bila aplikasi dapat boot sekaligus basis data menerima kueri; kegagalan koneksi mengikuti mekanisme Laravel dan menghasilkan HTTP 500 dengan status `down`, sehingga load balancer tidak lagi mengirim trafik ke instans yang kehilangan basis datanya | ✅ Selesai | Dua regresi membuktikan kedua sisi: koneksi sehat → **200 `up`**, koneksi rusak → **500 `down`**. `pint --test` lulus; `composer test:gerbang` **266/266 tes, 1.375 asersi lulus** |
| **P2-R04** Tidak ada strategi pencadangan terdokumentasi | **Selesai 2 Okt 2026.** `BE-opera/docs/pencadangan.md` menetapkan RPO 24 jam, RTO 4 jam kerja, retensi 14 harian + 12 bulanan, jadwal cron, dan prosedur pemulihan. Dua skrip: `scripts/cadangkan.sh` (dump basis data + arsip `storage/app/private` dalam satu run, manifest, checksum, kunci anti-tumpang, retensi, mode `--verifikasi` yang memulihkan ke basis data sementara) dan `scripts/pulihkan.sh` (mode latihan yang tidak menyentuh produksi, dan mode produksi yang menuntut konfirmasi diketik penuh). **Keputusan rancangan yang menentukan:** basis data dan lampiran dicadangkan bersama, karena `TRANS_REALISASI_LAMPIRAN` hanya menyimpan path — cadangan basis data tanpa berkasnya menghasilkan bukti hilang sementara sistem menyatakan lampirannya ada, yaitu kegagalan P1-R02 pada tingkat cadangan. Basis data di-dump lebih dulu, lampiran sesudahnya: urutan ini hanya menghasilkan berkas yatim yang tak berbahaya, urutan sebaliknya menghasilkan metadata yang menunjuk berkas hilang. Kredensial lewat berkas berizin 600, bukan argumen baris perintah yang tampak di daftar proses. `storage/backup/` masuk `.gitignore` | ✅ Selesai | Diuji dengan tiruan `mysqldump` karena MySQL lokal tidak dapat diakses: pencadangan jalan utuh (arsip lampiran 19 MB, manifest, checksum), kunci menolak run kedua dengan exit 0, retensi memangkas 37 → 26 cadangan tepat 14 harian + 12 bulanan, pemulihan menolak cadangan ber-checksum yang dirusak dengan exit 1 sebelum menyentuh apa pun, mode produksi menolak cadangan tanpa checksum, dan jalur latihan sehat exit 0 tanpa menyentuh lampiran. **Belum diuji:** jalur `mysqldump`/`mysql` sungguhan — perlu dijalankan sekali di server yang punya MySQL. Suite tetap 263/263 |
| **P2-R05** Suite backend sengaja merah | **Selesai 2 Okt 2026.** Pemisahan struktural terpasang: grup `papan-skor` + dua skrip composer (`test:gerbang` mengecualikannya dan wajib hijau, `test:papan-skor` boleh merah dan tidak memblokir, `test` menjalankan keduanya), dengan `--do-not-fail-on-empty-test-suite` sehingga job papan skor tetap exit 0 ketika tidak ada tiket terbuka. Konvensinya ditulis di docblock `AuditBugBackendTest` dan di `AGENTS.md`, termasuk aturan yang paling mudah terlupa: **hapus tanda grupnya begitu tiket ditutup**, karena tanda yang tertinggal berarti perlindungan yang tidak pernah ditegakkan lagi. Saat ini tidak ada tes bertanda — seluruh 263 tes menjaga gerbang | ✅ Selesai | `composer test:gerbang` 263/263 lulus; `composer test:papan-skor` exit 0 pada grup kosong (diverifikasi langsung dengan memeriksa exit code, bukan label laporannya) |

**Verifikasi yang dijalankan ulang 1 Oktober 2026.** Backend: `composer test` → **255 tes,
242 lulus, 13 gagal, 1.323 asersi**. Frontend: `npm test` → **23 berkas / 171 tes lulus**,
`npm run lint` nol warning, `npm run build` lulus.

**Catatan P2-14.** Pekerjaan yang belum di-commit di `BE-opera` sudah membungkus
`CapaianService::recalculatePeriode()` dalam `DB::transaction()` dengan `lockForUpdate()`
pada periode, subkegiatan, dan aktivitas. Itu menutup sebagian P2-14, tetapi statusnya
tetap **belum** sampai perubahannya di-commit dan diverifikasi.

## Delta Audit 10 September 2026

Menutup **P1-17** (empat fitur yang mendarat setelah daftar tiket audit dibekukan) dengan audit
kesesuaian penuh atas keempatnya, plus menambah cakupan tes pada tujuh file yang menutup celah
ditemukan selama audit tersebut. Dua temuan tambahan yang muncul selama audit — race condition
pada pemindahan/pelepasan rencana dan tidak tercabutnya sesi lain saat password direset — sengaja
**tidak diperbaiki** pada putaran ini dan dibuka sebagai tiket tersendiri (P1-18, P2-14) supaya
tidak hilang dari daftar.

1. **P1-17 ditutup — audit kesesuaian atas empat fitur selesai, hasilnya sesuai kebijakan yang
   sudah tercatat.** Kalender Rencana + agenda, Penunjukan Bidang, `FLAG_DIPAKAI` pendukung, dan
   reset/ganti password diperiksa terhadap keputusan bisnis yang berlaku dan terhadap workbook.
   Tidak ditemukan penyimpangan angka capaian. Ringkasan per fitur:
   `../audits/audit-menyeluruh-2026-09-06.md` §A-05.
2. **P1-18 dibuka — reset dan ganti kata sandi tidak mencabut sesi/token lain milik pengguna.**
   `PenggunaController::resetPassword()` dan `AuthController::gantiPassword()` mengganti kolom
   `password` tapi tidak memanggil `tokens()->delete()` maupun membatalkan sesi `web` aktif milik
   pengguna target. Token Sanctum atau sesi yang sudah diambil sebelum reset — termasuk oleh pihak
   yang tidak berwenang — tetap sah setelahnya. Diklasifikasikan **P1** karena ini kontrol
   keamanan yang gagal melakukan satu-satunya hal yang diharapkan pengguna saat mereset kata
   sandi. Sengaja tidak diperbaiki pada putaran ini (keputusan cakupan A-05).
3. **P2-14 dibuka — race condition (TOCTOU) pada pindah-bidang dan lepas rencana.**
   `RencanaController::pindahBidang()` (baris ~300-307) dan `destroy()` (baris ~340-344) memeriksa
   `adaRealisasi()` lalu melakukan `update()`/hapus tanpa `DB::transaction()` maupun
   `lockForUpdate()`. Ada jendela waktu antara pemeriksaan dan penulisan tempat
   `POST /realisasi-kegiatan` bisa disisipkan bersamaan pada subkegiatan yang sama. Diklasifikasikan
   **P2** karena jendela peluangnya sempit — rencana hanya berubah saat periode DRAFT, sedangkan
   realisasi baru bisa dicatat saat OPEN; risiko nyata hanya ada pada detik-detik transisi status
   periode atau permintaan ganda pada baris yang sama. Sengaja tidak diperbaiki pada putaran ini
   (keputusan cakupan A-05).
4. **Keputusan bisnis baru — "bidang seragam per kegiatan" tetap warning-only.** Titik amber pada
   `PanelPenunjukan.tsx` murni indikator visual; backend sengaja tidak menambah validasi yang
   menolak hasil campur-bidang dalam satu kegiatan. Dicatat di `../keputusan-terbuka.md` §2e beserta
   tes regresi yang menguncinya.
5. **Celah cakupan tes ditutup untuk keempat fitur P1-17** — rincian lengkap per file test di
   `../audits/audit-menyeluruh-2026-09-06.md` §A-05 bagian Verifikasi. Ringkas: `JadwalKegiatanTest.php`
   +5 tes, `KalenderRencana.test.tsx` +3 tes, `PenyusunanRencanaTest.php` +2 tes,
   `GantiPasswordTest.php` +1 tes, `BidangPenggunaTest.php` +2 tes, `ganti-kata-sandi-dialog.test.tsx`
   (baru) 4 tes, `ManajemenPengguna.test.tsx` +2 tes.
6. Verifikasi otomatis pasca-perubahan: `composer test` **226 tes, 1194 asersi lulus** (kontribusi
   A-05 tepatnya +10 tes backend dari keempat file di atas; repo ini adalah kerja audit
   berkelanjutan yang belum di-commit sejak 2 September 2026, jadi sisa kenaikan dari baseline 214
   berasal dari pekerjaan lain di luar cakupan A-05, mis. paginasi `GET /aktifitas-master` C-03);
   `npm test` **19 berkas, 146 tes lulus** (kontribusi A-05: +9 tes lintas 3 berkas ditambah 1
   berkas baru); `npm run lint -- --max-warnings=0` **lulus tanpa error/warning**;
   `npm run build` **lulus** (bundle `1.315,77 kB`, gzip `372,89 kB` — tidak berubah oleh perbaikan
   A-05, tetap tercatat terpisah sebagai C-04).

## Delta Audit 6 September 2026

Audit menyeluruh FE→BE dengan empat lapisan bukti: sel workbook dibaca ulang lewat parser
independen yang mereplikasi semantik parser produksi (hasil identik 78/78/361/439), seed bersih ke
database terpisah, pembacaan kode, dan penelusuran aplikasi berjalan sebagai klien HTTP
berautentikasi sesi. Database kerja tidak diubah.

1. **P0-09 dibuka lalu ditutup pada hari yang sama — capaian salah hitung setelah pendukung ditambah/dihapus saat periode OPEN.**
   `CapaianService::redistribusiBobotPendukung()` memperbarui `BOBOT_TARGET` tanpa menghitung ulang
   `BOBOT_REALISASI`. Terbukti lewat `POST /api/v1/aktifitas-bidang` (HTTP 201) pada subkegiatan
   `5.1.1.2.03.6` periode OPEN: dua baris menyimpan `BOBOT_REALISASI` 10,00 melampaui
   `BOBOT_TARGET`-nya sendiri 7,50, dan `CAPAIAN` tertahan 90,00 padahal seharusnya 85,00.
   `POST /periode/5/hitung-ulang` memulihkannya ke 85,00 — tetapi endpoint itu tidak punya tombol
   di UI. Belum mencemari data kerja karena `FLAG_ADHOC=1` dan `FLAG_DIPAKAI=0` sama-sama 0 baris.
   **Ditutup 6 September 2026:** redistribusi kini menghitung ulang realisasi seluruh pendukung
   setelah semua `BOBOT_TARGET` baru tersimpan. Tes regresi mereplikasi kondisi capaian 90,00,
   menambah pendukung keempat, lalu membuktikan bobot realisasi lama turun dari 10,00 menjadi 7,50,
   capaian menjadi 85,00, dan tidak ada `BOBOT_REALISASI > BOBOT_TARGET`.
2. **P1-15 dibuka lalu diputuskan pada hari yang sama — bobot pendukung 30/n tidak berasal dari workbook.** Rumus capaian milik workbook
   sendiri (kolom M) hanya menjumlahkan 3 baris pendukung pertama pada 25 subkegiatan, dan menuliskan
   bobot 10% per baris. Dibaca utuh, 74 dari 78 subkegiatan workbook berjumlah tepat 100%. Sistem
   menyebar 30% ke seluruh pendukung, sehingga 132 dari 361 baris pendukung memikul bobot yang di
   workbook bernilai nol. Selisih capaian terburuk 26,10 poin pada `5.1.1.2.02.1` (Keuangan, 23
   pendukung). Butuh keputusan bisnis tertulis.
   **Keputusan 6 September 2026: cara (a) 30/n disahkan.** Dasarnya, setiap pekerjaan yang dicatat
   dan dibuktikan harus menambah capaian; cara (b) menghanguskan pekerjaan nyata semata-mata karena
   posisi barisnya di katalog. Perhitungan ulang atas realisasi nyata menunjukkan dampak agregat
   kedua cara nyaris sama (selisih capaian perangkat daerah ≤ 0,29 poin, hanya 29 baris berubah),
   sehingga yang menentukan adalah keadilan pengakuan pekerjaan, bukan angka. Tercatat di
   `../keputusan-terbuka.md` §2b. Tidak ada perubahan kode.
3. **P0-05 tetap selesai, tetapi premisnya dikoreksi.** Invarian yang diperiksa tiket itu terbukti
   benar sekali lagi — nol baris rencana berbobot selain 100 di database audit maupun database kerja.
   Namun angka `4,29` yang dipakai saat normalisasi berasal dari aturan 30/n, bukan dari workbook;
   workbook menuliskan `10,00` untuk tiga baris pertama pada 19 dari 20 transaksi itu. Kesesuaian
   angka tersebut kini menjadi bagian P1-15, bukan bukti kesesuaian workbook.
4. **P1-13 ditutup.** `npm test` lulus 16 berkas / 125 tes. Cakupan kini mencakup dialog sesi,
   Master Bidang, konfirmasi realisasi, filter aktivitas, kalender, penunjukan, periode, rencana
   bidang, manajemen pengguna, bobot, dan peran.
5. **P3-04 tetap terbuka, titik gagalnya bergeser.** `php artisan test` mati dengan exit 2 di batas
   128 MB pada `RealisasiTest::test_ubah_menolak_jumlah_negatif_dan_pecahan`, bukan lagi pada tes
   pratinjau lampiran — menandakan akumulasi memori lintas-suite. Dengan 512 MB seluruh **212 tes /
   1093 asersi** lulus.
6. **P1-16 dibuka — data master tidak bisa dihapus dari UI.** Backend menyediakan `DELETE` untuk
   program, kegiatan, subkegiatan, aktifitas-master, dokumen-perencanaan, dan periode; tidak satu pun
   terpasang di frontend. Karena import bersifat create-only, salah import hanya bisa dibereskan
   lewat SQL manual.
   **Dikoreksi kemudian pada hari yang sama — kalimat terakhir itu salah.** UI menyediakan toggle
   nonaktifkan untuk kelima entitas master (`DataMaster.tsx:132` → `setAktif*`,
   `MasterDokumen.tsx:96`), dan itu justru jalur yang disarankan pesan penolakan `DELETE` backend
   sendiri. Keenam `destroy()` juga berpagar ketat sehingga tombol hapus akan menolak setiap baris
   katalog resmi. Sisa celah nyata hanya periode, yang tidak punya jalur pembersihan sama sekali;
   tiket diturunkan menjadi **P3-07**. Rincian: `../audits/audit-menyeluruh-2026-09-06.md` §C-05.
7. **P1-17 dibuka — empat fitur tanpa cakupan audit:** Kalender Rencana + agenda, Penunjukan Bidang,
   `FLAG_DIPAKAI` pendukung, serta reset & ganti password. Semuanya berfungsi pada penelusuran, tetapi
   tidak masuk kriteria selesai audit.
8. **P2-10 sampai P2-13 dan P3-05 sampai P3-06 dibuka** untuk cap 100% yang tak terdokumentasi,
   endpoint tanpa layar, satuan/output yang hampir seluruhnya kosong, token API menumpuk, regresi
   lint, dan kode mati. Rinciannya di dokumen audit menyeluruh.
9. **Yang terbukti benar dan tidak boleh dirusak perbaikan:** struktur 5/20/78/439 reproducible dari
   seed bersih dengan sebaran tujuh unit 19/15/12/11/9/8/4; invarian bobot 70/30/100 utuh; rantai
   `REALISASI → BOBOT_REALISASI → CAPAIAN` konsisten di database kerja; gerbang peran ditegakkan
   server (403 pada enam endpoint admin aplikasi yang diuji); siklus periode terminal ditegakkan;
   realisasi wajib berbukti; pratinjau import setara seed.

## Delta Audit 4 September 2026

1. **P2-04 — komponen sesi kedaluwarsa diselaraskan dengan template.** Notifikasi `SweetAlert` pada provider sesi diganti dengan `AlertDialog` bawaan FE, berisi penjelasan sesi habis dan aksi **Masuk kembali**. Pembersihan sesi serta alur redirect menuju Login tetap dipertahankan.
2. Tes komponen baru memancarkan event `opera:unauthorized`, memastikan dialog, judul, deskripsi, dan aksi tampil, lalu memastikan aksi menutup dialog (**1 tes lulus**). Lint dan production build frontend juga lulus; build hanya melaporkan peringatan ukuran chunk yang sudah ada dan tidak menggagalkan proses.
3. **Master Bidang — hapus bidang kosong dan filter status tersedia di UI aktif.** Layar `/master-bidang` secara default hanya meminta bidang aktif, dengan filter **Tampilkan semua bidang** untuk menyertakan bidang nonaktif. Aksi **Hapus** memakai konfirmasi, memanggil `DELETE /bidang/{id}`, memuat ulang daftar bila berhasil, dan menampilkan pesan backend bila bidang memiliki pengguna, rencana, atau capaian.
4. Tes interaksi UI memastikan filter mengubah parameter `termasukNonaktif` serta aksi hapus dikonfirmasi dan endpoint dipanggil (**2 tes lulus**). `BidangPenggunaTest` backend membuktikan bidang kosong dapat dihapus sedangkan bidang yang memiliki pengguna ditolak (**18 tes, 52 assertion lulus**); lint dan production build frontend lulus.
5. **Catat Realisasi — pencarian aktivitas ditambahkan.** Pencarian bekerja bersama filter status dan jenis, mencocokkan kode subkegiatan, nama subkegiatan, serta nama aktivitas tanpa membedakan kapital. Empty state membedakan hasil pencarian kosong dari kombinasi filter kosong. Suite filter aktivitas kini lulus **13 tes**; lint dan production build frontend lulus.
6. **P2-03 — peringatan aksesibilitas dialog pratinjau diperbaiki.** `PratinjauLampiran` kini memasang `DialogDescription` yang terhubung dengan `DialogContent`, sehingga Radix tidak lagi melaporkan deskripsi/`aria-describedby` yang hilang saat pratinjau bukti dibuka. Lint dan production build frontend lulus.
7. **P1-03 — visual pembagian bobot diperjelas.** Meter kini membedakan alokasi melalui warna dasar dan progres realisasi melalui warna pekat. Legenda panjang yang mengulang bobot setiap aktivitas diganti dua kartu ringkas untuk utama dan pendukung, termasuk jumlah aktivitas, bobot per aktivitas bila seragam, bobot total aktual, serta penjelasan arti warna. Tes komponen dan algoritma bobot lulus **19 tes**; lint dan production build frontend lulus.
8. **P2-07 — drill-down kegiatan historis tidak lagi meminta ID nol.** Capaian Program kini mencocokkan kode monitoring terhadap master program/kegiatan termasuk baris nonaktif, sehingga snapshot periode lama tetap memperoleh ID valid. Service menolak ID nol sebelum request dan UI menangkap kegagalan rincian agar tidak menjadi Promise tak tertangani. Tes regresi service lulus **2 tes**; lint dan production build frontend lulus.

## Delta Audit 1 September 2026

1. **P0-05 — sempat dibuka kembali: bobot transaksi historis tidak tepat 100%.** Audit database lokal menemukan 20 subkegiatan dengan tujuh aktivitas pendukung yang masing-masing masih menyimpan `4,29`; bobot pendukung menjadi `30,03` dan total menjadi `100,03`. UI membulatkan total ke satu desimal sehingga terlihat `100,0%`, tetapi `KesiapanRencanaService` memeriksa dua desimal dan dengan benar menolak rencana tersebut. Empat contoh pada laporan pengguna adalah `5.1.3.2.02.1`–`5.1.3.2.02.4`.
2. Algoritma aktif sudah benar untuk data baru: enam aktivitas menerima `4,29` dan aktivitas terakhir `4,26`. Tes unit dan penugasan baru juga membuktikan jumlah tepat `30,00`; celahnya adalah belum ada backfill idempoten bagi transaksi lama maupun tes regresi yang memulai dari data lama `30,03`.
3. **P0-05 — ditutup kembali melalui koreksi data manual yang diminta pemilik produk.** Seluruh 20 transaksi terdampak dinormalisasi memakai `CapaianService::redistribusiBobotPendukung()`, bukan pembaruan SQL aritmetis langsung. Audit sesudah koreksi menemukan `invalid=0`; contoh `5.1.3.2.02.1`–`5.1.3.2.02.4` masing-masing tepat `70,00 + 30,00 = 100,00`. Gerbang kesiapan periode 1 untuk bidang 10 dan 11 mengembalikan `boleh=yes` serta `butir=0`.
4. Tidak dibuat migration/backfill permanen karena perbaikan data diminta dilakukan manual. Regresi algoritma diverifikasi oleh tes bobot terarah: **8 tes, 40 assertion lulus**. Algoritma aktif dan jalur redistribusi tetap mencegah data baru mengulangi selisih tersebut.
5. **P2-04 — perilaku redirect login disesuaikan.** Sesuai keputusan produk 1 September 2026, login sukses selalu menuju `/dashboard`, termasuk setelah sesi kedaluwarsa atau ketika halaman Login menerima state halaman asal. Nilai redirect tersimpan dibersihkan setelah autentikasi agar tidak memengaruhi login berikutnya. Lint dan production build frontend lulus.
6. **P1-14 — ditutup: mode Subkegiatan dan halaman detail Rencana Saya.** Mode **Subkegiatan** kini menjadi tampilan utama admin bidang, sedangkan mode **Aktivitas** mempertahankan tabel lama. Route `/rencana-saya/{id}` menampilkan snapshot program–kegiatan–subkegiatan, indikator/output, target, capaian, pembagian bobot, aktivitas, realisasi, serta agregat catatan/bukti. Aksi Catat hanya muncul saat periode `OPEN` dan membawa konteks periode/aktivitas; tautan Bukti membawa periode yang sama.
7. Backend menyediakan payload daftar ringkas melalui `GET /bidang-saya/rencana?ringkas=1` dan detail melalui `GET /bidang-saya/rencana/{id}`. Detail selalu difilter ke bidang pengguna sehingga percobaan ID milik bidang lain menghasilkan 404. Kontrak daftar lengkap lama dipertahankan untuk Catat Realisasi dan Bukti Kegiatan. Suite Penyusunan Rencana + Realisasi lulus **40 tes, 172 assertion**; lint dan production build frontend lulus.
8. **P1-13 — meningkat menjadi sebagian: runner tes frontend tersedia.** Vitest, jsdom, dan Testing Library telah ditambahkan bersama script `npm test`. Suite pertama menguji orkestrasi konfirmasi realisasi melebihi target: alur normal, pembatalan tanpa aksi simpan, serta konfirmasi yang melanjutkan penyimpanan (**3 tes lulus**). Cakupan guard sesi/peran, import, kesiapan, CRUD realisasi komponen penuh, bukti, dan retry masih terbuka.
9. **Regresi modal konfirmasi P1-01 diperbaiki.** SweetAlert yang bertumpuk di atas Dialog form menyebabkan konflik focus trap dan tombol tidak dapat diklik konsisten. Konfirmasi tambah/koreksi kini memakai `AlertDialog` aset default FE. Tes komponen melakukan klik aktual pada **Periksa kembali** dan **Tetap simpan**, serta memastikan fokus awal berada pada aksi aman (**3 tes lulus**); lint dan production build lulus.
10. **Label sidebar Dashboard yang usang dihapus.** Teks `Sebagian mock · daftar tertinggal` tidak lagi ditampilkan karena Dashboard dan daftar subkegiatan tertinggal sudah memakai endpoint backend produksi. Pencarian source aktif memastikan tidak ada label mock serupa yang tersisa; lint dan production build lulus.

## Delta Audit 30 Agustus 2026

Audit ulang ini membaca workbook langsung melalui format XLSX/PhpSpreadsheet, memeriksa artefak `opera-ink-katalog.json`, menelusuri UI aktif dan kontrak API, lalu menjalankan verifikasi otomatis.

Temuan audit verifikasi terbaru:

1. **P0-08 — ditutup: artefak seed dan target kosong telah diverifikasi.** Katalog diregenerasi oleh parser kanonik dari workbook. Workbook hanya mempunyai tiga satuan eksplisit (`2 Dokumen`, `3 Dokumen`, `1 Berita Acara`); ketiganya masuk ke JSON dan database, sedangkan 75 nilai sumber yang kosong tetap `null`. Target kosong `5.1.1.2.01.2` ditandai `TARGET_NOL_DIIZINKAN`, dibekukan ke transaksi, dan diterima oleh gerbang kesiapan tanpa mengisi angka fiktif. Tes otomatis memeriksa sel workbook → seed → pembukaan periode.
2. **P2-08 — ditutup: koreksi dan hapus realisasi sudah tersedia di UI aktif.** Riwayat aktivitas memuat aksi ubah/hapus, guard periode OPEN, konfirmasi, dan perhitungan ulang backend.
3. **P2-09 — ditutup: metadata riwayat dan bukti telah diagregasi.** Endpoint rencana bidang kini mengembalikan jumlah catatan, jumlah lampiran, serta catatan/lampiran yang diperlukan layar Bukti dalam eager loading terukur. Mapper UI memakai nilai nyata dan tidak lagi meminta riwayat satu per aktivitas.
4. **P0-07 — ditutup: output import interaktif telah disamakan dengan seed.** `KatalogExcelImportService` memuat `OPERA INK` dan `Programmed`, lalu memakai pasangan kode/nama subkegiatan sebagai kunci output pelengkap. Audit preview/final melaporkan satu output terisi. Tes feature membuktikan output workbook resmi bertahan pada preview, import, master, snapshot rencana, monitoring, dan CSV; cleanup workbook juga mencegah akumulasi memori antar-parse.
5. **P2-01 — ditutup: baseline dan aturan referensial import telah ditegakkan.** Workbook resmi ditolak bila tidak tepat 5 program/20 kegiatan/78 subkegiatan/439 aktivitas atau tidak memuat tepat tujuh bidang sumber. Template hanya menerima tujuh bidang tersebut dan menolak metadata struktur/subkegiatan yang tidak konsisten. Tes endpoint mencakup validasi, konflik create-only, dan otorisasi.
6. **P1-13 — belum ada tes frontend/UI.** `package.json` tidak mempunyai script test dan tidak ada suite komponen/E2E. Build dan lint tidak membuktikan aksi import, retry error, edit/hapus realisasi, redirect sesi, maupun guard peran bekerja di browser.
7. **P3-04 — perintah tes backend standar tidak stabil.** `php artisan test` gagal pada batas memori PHP 128 MB saat suite mencapai preview lampiran. Seluruh **146 tes/809 assertion** lulus ketika dijalankan langsung dengan batas 512 MB, dan `RealisasiTest` sendiri lulus pada 128 MB; ini menunjukkan akumulasi memori suite/runner yang belum ditangani.

## Baseline Workbook yang Diverifikasi

Sheet `OPERA INK` memuat:

- 5 program;
- 20 kegiatan;
- 78 subkegiatan;
- 439 aktivitas, terdiri dari 78 aktivitas utama dan 361 aktivitas pendukung;
- 7 unit penanggung jawab sebagaimana tertulis di sumber: P2EPD, SEKERTARIAT, PIK, RINOVA, Subbag Perencanaan, PPM, dan Keuangan.

Temuan kualitas data sumber yang tetap harus diperlakukan secara eksplisit:

- kode subkegiatan `5.1.2.2.01.4` muncul lebih dari sekali;
- subkegiatan `5.1.1.2.01.2` tidak mempunyai target dan satuan pada baris sumber;
- sheet `Programmed` tidak dapat dianggap sebagai sumber lengkap karena hanya sebagian baris terisi penuh dan terdapat rumus yang tidak konsisten, antara lain `J23 = H23*(H23/G23)`;
- workbook tidak mendefinisikan bobot bidang atau rumus agregasi lintas bidang.

## Respons Perbaikan yang Sudah Tepat

### 1. Penghapusan bobot bidang — selesai

Bobot bidang sudah dihapus dari migration, model, API, seeder, validasi pembukaan periode, serta UI master bidang. Capaian perangkat daerah sekarang dihitung sebagai rerata langsung capaian penugasan subkegiatan-bidang.

Penilaian:

- **sesuai workbook** untuk keputusan bahwa bidang tidak memiliki bobot;
- rumus rerata lintas bidang tetap merupakan **kebijakan aplikasi**, bukan rumus yang berasal dari workbook, sehingga perlu dicatat dalam keputusan bisnis.

### 2. Log aktivitas — fungsi inti selesai

Backend sudah mempunyai tabel, model, service, controller, route, dan pencatatan perubahan untuk proses master, periode, rencana, realisasi, lampiran, serta aktivitas ad-hoc. UI juga sudah memanggil endpoint backend dan aksesnya dibatasi untuk `admin_aplikasi`.

Catatan peningkatan: log belum menjadi audit trail penuh karena belum menyimpan perbandingan nilai sebelum/sesudah dan belum mencatat login/logout.

### 3. Detail subkegiatan, bukti, dan koreksi — selesai

Halaman detail menampilkan aktivitas, realisasi, lampiran, bobot, serta ledger melalui backend. UI aktif juga sudah menyediakan pengelolaan lampiran serta koreksi/hapus catatan realisasi dengan guard periode dan peran.

## Bukti Teknis yang Diperiksa

Area backend utama:

- `BE-opera/app/Services/CapaianService.php`
- `BE-opera/app/Services/DashboardService.php`
- `BE-opera/app/Services/LogAktivitasService.php`
- `BE-opera/app/Http/Controllers/Api/AdminAplikasi/PeriodeController.php`
- `BE-opera/app/Http/Controllers/Api/AdminAplikasi/ExcelImportController.php`
- `BE-opera/app/Services/KatalogExcelImportService.php`
- `BE-opera/database/migrations/2026_08_29_000016_create_trans_log_aktivitas_table.php`
- `BE-opera/database/seeders/OperaInkSeeder.php`
- `BE-opera/routes/api.php`
- `BE-opera/app/Http/Controllers/Api/AdminBidang/AktifitasBidangController.php`
- `BE-opera/database/data/scripts/parse-opera-ink-xlsx.py`

Area frontend utama:

- `FE-bapperrida1/src/services/capaian.service.ts`
- `FE-bapperrida1/src/services/periode.service.ts`
- `FE-bapperrida1/src/services/realisasi.service.ts`
- `FE-bapperrida1/src/services/log.service.ts`
- `FE-bapperrida1/src/pages/opera/RencanaSaya.tsx`
- `FE-bapperrida1/src/pages/opera/DetailSubkegiatan.tsx`
- `FE-bapperrida1/src/pages/opera/CapaianProgram.tsx`
- `FE-bapperrida1/src/components/opera/bobot-meter.tsx`

Verifikasi otomatis pada audit menyeluruh terbaru (6 September 2026):

- backend standar `php artisan test`: **gagal, exit 2** — batas memori 128 MB terlampaui pada `RealisasiTest::test_ubah_menolak_jumlah_negatif_dan_pecahan`;
- backend dengan `php -d memory_limit=512M vendor/bin/phpunit`: **213 tes lulus, 1106 assertion**;
- frontend `npm test`: **16 berkas, 125 tes lulus**;
- frontend `npm run lint -- --max-warnings=0`: **lulus tanpa error/warning**;
- frontend `npm run build`: **berhasil**, bundle **1.315,52 kB** (gzip **372,74 kB**), masih melewati ambang 500 kB;
- `migrate:fresh --seed` ke database terpisah: **berhasil** — 5 program / 20 kegiatan / 78 subkegiatan / 439 aktivitas / 7 bidang;
- integritas database kerja: **bersih** — `BOBOT_REALISASI > BOBOT_TARGET` 0 baris, `CAPAIAN` ≠ `SUM(BOBOT_REALISASI)` 0 baris, `REALISASI` ≠ jumlah catatan 0 baris, bobot rencana selain 100 sebanyak 0 baris.

Kelulusan tes membuktikan implementasi yang diuji stabil, bukan membuktikan seluruh aturan workbook sudah tercakup. Gap P0 di atas harus dijadikan acceptance test baru.

## Urutan Tiket Fix yang Disarankan — beku (10 September 2026)

Saran urutan pada audit 10 September 2026, dibiarkan sebagai catatan sejarah. Urutan yang
berlaku sekarang ada di [`audit-kesiapan-produksi-2026-10-01.md`](../audits/audit-kesiapan-produksi-2026-10-01.md) §7.

1. **P2-11 sebagian**: pasang tombol hitung ulang pada layar Periode sebagai jaring pengaman operasional.
2. ~~**P1-15**: ambil keputusan bisnis tertulis atas bobot pendukung.~~ **Selesai 6 Sep 2026** — cara (a) 30/n disahkan, tercatat di `../keputusan-terbuka.md` §2b. Tidak ada perubahan algoritma.
3. ~~**P0-08 lanjutan**: pindahkan empat subkegiatan cacat workbook ke `QUALITY_RESOLUTIONS`.~~ **Selesai 6 Sep 2026** — cacat kini dideteksi programatik dari rentang SUM kolom M, wajib beresolusi, dan import berhenti bila ada cacat baru yang belum diputuskan. Lihat `../audits/audit-menyeluruh-2026-09-06.md` §A-03.
4. **P3-07** (semula P1-16, dikoreksi dan diturunkan): pasang jalur pembersihan periode `DRAFT`. Jalur nonaktifkan untuk master lain sudah ada dan berfungsi — tidak ada pekerjaan di sana.
5. ~~**P3-04**: stabilkan perintah tes backend standar.~~ **Selesai 6 Sep 2026** — runner Composer menetapkan batas 512 MB; audit optimasi memori terpisah.
6. ~~**P1-17**: buat tiket turunan untuk empat fitur yang belum tercakup.~~ **Selesai 10 Sep 2026** — keempat fitur diaudit, sesuai kebijakan yang berlaku; dua tiket turunan dibuka: **P1-18** (sesi/token tidak dicabut saat reset password) dan **P2-14** (race condition pindah/lepas rencana).
7. **P1-18 → sekarang P0-R01**: cabut sesi/token Sanctum lain saat password direset/diganti. Dinaikkan ke P0 pada 1 Okt 2026 setelah terbukti juga berlaku pada jalur nonaktifkan pengguna.
8. **P2-14** (baru): bungkus `pindahBidang()`/`destroy()` rencana dalam transaksi dengan row-lock.
9. ~~Sisanya: P3-06 (backend lama).~~ **Selesai 1 Okt 2026** — `bapperrida-laravel13/` dan `opera-backend/` dihapus dengan persetujuan eksplisit; dokumen `opera-backend` yang tak tergantikan diarsipkan ke `BE-opera/docs/opera-backend-asal/`.
10. P1-12 tetap ditangguhkan sampai keputusan domain tersedia.

## Protokol Respons Perbaikan (Wajib)

Setiap kali sebuah tiket dikerjakan, pelaksana wajib:

1. Memverifikasi implementasi dan menjalankan tes yang relevan.
2. Memperbarui **satu baris tiket di berkas ini**: respons implementasi, status, dan bukti
   verifikasi. Itu seluruh pekerjaan dokumentasinya.
3. Tidak menandai tiket selesai bila perubahan belum diterapkan atau belum diverifikasi.

Yang **tidak** perlu dan tidak boleh dilakukan:

- memperbarui status di laporan audit mana pun di `../audits/` — laporan bertanggal dibekukan
  dengan sengaja, dan menyuntingnya menghapus bukti keadaan pada hari audit;
- menghitung ulang jumlah tiket per prioritas — berkas ini tidak lagi menyimpan angka itu;
  pakai `python3 ../../scripts/hitung-tiket.py`;
- memperbarui daftar urutan pengerjaan — urutan hidup di laporan audit terbaru.

Butir keputusan di `../keputusan-terbuka.md` ditulis hanya bila sebuah **keputusan domain
baru** diambil, dan isinya alasan keputusan — bukan status tiket. Tidak setiap tiket
melahirkan keputusan.

Status yang dipakai: `✅ Selesai` · `⚠️ Sebagian` · `❌ Belum` · `⏸️ Ditangguhkan`.
Skrip hitung mengenali keempat penanda itu, jadi tulis tepat seperti di atas.

## Kriteria Selesai Audit Kesesuaian

Implementasi baru dapat dinyatakan sesuai setelah:

- seluruh tiket P0 mempunyai tes integrasi backend dan UI;
- fixture resmi mempertahankan jumlah 5 program, 20 kegiatan, 78 subkegiatan, dan 439 aktivitas, dengan resolusi eksplisit untuk anomali sumber;
- pembagian bobot selalu berjumlah tepat 100 per subkegiatan;
- target, satuan, output, penanggung jawab, dan struktur aktivitas dapat ditelusuri dari master sampai transaksi dan laporan;
- tidak ada service produksi yang mengambil data capaian dari mock;
- formula agregasi yang tidak didefinisikan workbook mempunyai keputusan bisnis tertulis dan contoh hasil yang disetujui;
- setiap aturan yang mengubah angka capaian dapat ditelusuri ke sel workbook **atau** ke keputusan bisnis tertulis — 30/n, cap 100%, dan rerata datar lintas bidang termasuk di dalamnya;
- perubahan pembagi bobot pada rencana yang sudah punya realisasi mempunyai tes regresi;
- setiap route `routes/api.php` berstatus salah satu dari: dipakai layar X, sengaja tanpa layar, atau celah operasional yang bertiket.

**Putusan audit menyeluruh 6-10 September 2026: kebenaran angka sudah tertutup sepenuhnya; kelengkapan operasional dan hardening keamanan masih menyisakan tiket terdokumentasi (P1-18, P2-11, P2-14, P3-07).** P3-06 ikut tertutup pada 1 Oktober 2026.

Yang terbukti kokoh: struktur 5/20/78/439 reproducible dari seed bersih dengan sebaran tujuh unit 19/15/12/11/9/8/4; invarian bobot 70/30/100 utuh; rantai `REALISASI → BOBOT_REALISASI → CAPAIAN` konsisten di database kerja; gerbang peran ditegakkan server; siklus periode terminal ditegakkan; realisasi wajib berbukti; pratinjau import setara seed; tes UI ada dan lulus 146 tes; empat fitur P1-17 (Kalender+agenda, Penunjukan Bidang, `FLAG_DIPAKAI`, reset/ganti password) diaudit penuh dan sesuai kebijakan yang berlaku.

Dua penghalang yang dibuka audit ini sudah tertutup pada hari yang sama. **P0-09** diperbaiki — `redistribusiBobotPendukung()` kini memanggil `recalculateAktifitas()` untuk setiap pendukung setelah pembagi berubah; reproduksi HTTP yang semula menghasilkan capaian 90,00 (seharusnya 85,00) kini menghasilkan 85,00 dengan nol baris `BOBOT_REALISASI > BOBOT_TARGET`. **P1-15** diputuskan — cara (a) 30/n disahkan, sehingga divergensi terhadap workbook pada 25 subkegiatan menjadi kebijakan tercatat dan premis P0-05 ikut sah.

Sisanya adalah kelengkapan operasional dan kebersihan teknis: P1-17, P2-11, dan P3-07 (P3-06 selesai 1 Okt 2026). Tidak satu pun memengaruhi kebenaran angka capaian.
