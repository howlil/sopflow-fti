# Invariant Database dan Transisi Status

Dokumen ini merangkum aturan bisnis yang tidak cukup dijelaskan oleh foreign key biasa. Sebagian aturan dikunci oleh trigger/migration database, sebagian oleh service transaction, dan sebagian menjadi kontrak domain untuk laporan tugas akhir.

## Sumber Kebenaran OPD Aktif Pengguna

`Pengguna.opdId` adalah sumber kebenaran OPD aktif pengguna selama legacy OPD workflow masih menjadi implementasi aktif.

`RiwayatOpdPengguna` menyimpan histori pasangan pengguna dan OPD. Field `isAktif` hanya penanda tampilan riwayat yang disinkronkan oleh service:

- Saat pengguna dibuat, service membuat riwayat OPD aktif sesuai `Pengguna.opdId`.
- Saat pengguna pindah OPD, service mengubah `Pengguna.opdId`, menonaktifkan seluruh riwayat OPD pengguna, lalu mengaktifkan baris riwayat OPD tujuan.
- Jika terjadi perbedaan, aplikasi harus mempercayai `Pengguna.opdId` dan memperbaiki `RiwayatOpdPengguna.isAktif`.

## FTI Platform Role dan Process Foundation

Model FTI ditambahkan secara additive; invariant legacy OPD tetap berlaku pada compatibility path sampai slice migrasi terkait memindahkan ownership/authority secara eksplisit.

- `Pengguna.platformRole` adalah axis administrasi platform yang terpisah dari `Pengguna.peran`. Nilai default adalah `USER`.
- `SUPER_ADMIN` tidak mengubah atau membypass `PeranPengguna`, Process relationship, review authority, final approval, atau TTE authority.
- `Process.scope = FACULTY` wajib memiliki `departmentId = NULL`.
- `Process.scope = DEPARTMENT` wajib memiliki satu `departmentId` valid. Kombinasi scope/context ini dikunci oleh trigger `trg_process_scope_department_insert` dan `trg_process_scope_department_update`, serta divalidasi service. Trigger digunakan karena MariaDB/MySQL menolak `departmentId` dipakai bersamaan dalam CHECK dan foreign-key referential action pada migration foundation.
- Setiap `Process` memiliki tepat satu `ownerId` melalui FK wajib ke `Pengguna`.
- Setiap `Process` harus memiliki minimal satu `ProcessMember`. Minimum ini divalidasi service pada create/update; composite primary key `(processId, penggunaId)` mencegah membership duplikat.
- Process Owner tidak diduplikasi sebagai `ProcessMember`; owner dan member adalah dua relationship contextual yang berbeda.
- Owner dan seluruh member yang ditugaskan harus merupakan pengguna aktif pada saat mutasi Process.
- Assignment pada Process A tidak memberikan relationship pada Process B.

`ProcessSopBinding` adalah compatibility seam untuk SOP target-path. Jika sebuah SOP memiliki binding Process, authoring/mutasi procedure ditentukan oleh relationship pengguna terhadap Process tersebut, bukan sekadar legacy role atau kesamaan `opdId`. SOP yang belum memiliki binding masih dapat menggunakan compatibility authorization sampai slice legacy contract cleanup.

## Contextual Final Approval

- `OrganizationalAuthorityAssignment` menyimpan holder kewenangan organisasi yang aktif untuk final approval target-path.
- Authority `DEAN` berlaku untuk Process scope `FACULTY`.
- Authority `HEAD_OF_DEPARTMENT` selalu dikunci ke satu `departmentId` dan hanya berlaku untuk Process scope `DEPARTMENT` pada Department tersebut.
- `SUPER_ADMIN` boleh memelihara konfigurasi authority, tetapi `platformRole = SUPER_ADMIN` tidak memberikan hak final approval dan tidak boleh menjadi workflow bypass.
- `ProcessFinalApproval` adalah evidence satu-per-`DetailSOP` bahwa holder authority yang ter-resolve menyetujui versi SOP Process-bound tersebut.
- Hanya versi `DetailSOP` terbaru dari SOP Process-bound yang dapat memperoleh contextual final approval. Versi lama yang pernah berada pada status siap approval ditolak setelah versi yang lebih baru tersedia.
- SOP tanpa `ProcessSopBinding` tetap berada pada compatibility workflow dan tidak masuk contextual final-approval path.
- Final approval tidak membuat `DetailSOP` menjadi `BERLAKU`. TTE dan effective-state transition tetap merupakan boundary terpisah.

## Transisi Status DetailSOP

Transisi manual lewat endpoint status hanya memperbolehkan:

- `DRAFT`, `SEDANG_DISUSUN`, atau `REVISI_DARI_EVALUATOR` ke `MENUNGGU_PENGAJUAN_EVALUASI` oleh `PENYUSUN` atau `PJ_PENYUSUN`.
- `MENUNGGU_PENGAJUAN_EVALUASI` ke `DIAJUKAN_EVALUASI` oleh `PJ_PENYUSUN`.
- `BERLAKU` ke `DICABUT` oleh `KEPALA_OPD`.

Transisi lain dikendalikan oleh proses evaluasi dan TTE:

- Saat pengajuan evaluasi dibuat, `DetailSOP.MENUNGGU_PENGAJUAN_EVALUASI` berubah menjadi `SEDANG_DIEVALUASI`.
- Jika evaluator memberi `PERLU_PERBAIKAN`, `DetailSOP` berubah menjadi `REVISI_DARI_EVALUATOR`.
- Jika evaluator menolak pengajuan, seluruh `DetailSOP` di dalamnya berubah menjadi `DITOLAK_EVALUATOR`. Status ini terminal: versi lama tidak dapat diedit atau diajukan ulang, tetapi dapat dijadikan sumber versi baru.
- Jika seluruh nilai evaluasi `SESUAI`, `DetailSOP` berubah menjadi `MENUNGGU_TTD_PJ_EVALUATOR`.
- Setelah BA ditandatangani `PJ_PENYUSUN`, `DetailSOP` berubah menjadi `DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI`.
- `DetailSOP.BERLAKU` hanya boleh terjadi melalui TTE `KEPALA_OPD`; service menghitung satu tanggal efektif kalender WIB, menempelkannya ke PDF sebelum tanda tangan digital, memakai objek tanggal yang sama untuk `DetailSOP.tanggalEfektif`, membuat `DokumenTte` jenis `SOP_BERLAKU`, mencatat `RiwayatTandaTangan`, dan mengganti versi lama yang `BERLAKU` menjadi `DIGANTIKAN`.

Database juga menjaga maksimal satu `DetailSOP.BERLAKU` per `SOP`.

## Transisi Status PengajuanEvaluasi

Alur status pengajuan evaluasi:

- `SEDANG_DIEVALUASI`: evaluator mengisi nilai per SOP.
- `DITOLAK`: penolakan final oleh evaluator; semua nilai menjadi `DITOLAK`, semua versi SOP menjadi `DITOLAK_EVALUATOR`, dan pengajuan tidak dapat dibuka kembali.
- `SELESAI_DIEVALUASI`: hanya boleh jika seluruh `NilaiEvaluasi.hasil = SESUAI`; untuk pengajuan `EVALUASI_REQUEST_EVALUATOR`, `nilaiOPD` wajib 1 sampai 5.
- `DITANDATANGANI_PJ_EVALUATOR`: terjadi setelah BA ditandatangani `PJ_EVALUATOR`.
- `DITANDATANGANI_PJ_PENYUSUN`: terjadi setelah BA ditandatangani `PJ_PENYUSUN`.
- `SELESAI`: terjadi setelah `KEPALA_OPD` menandatangani semua SOP dalam pengajuan.

Service memakai optimistic locking melalui `PengajuanEvaluasi.version` saat mutasi status.

## Invariant NilaiEvaluasi dan Tindak Lanjut

- `NilaiEvaluasi.hasil = PERLU_PERBAIKAN` wajib memiliki `catatan` tidak kosong.
- `NilaiEvaluasi.hasil = DITOLAK` hanya dapat ditetapkan oleh aksi penolakan tingkat pengajuan dan tidak memiliki tindak lanjut pada versi yang sama.
- Saat hasil menjadi `PERLU_PERBAIKAN`, `statusTindakLanjut` wajib `TERBUKA`, sedangkan `ditindaklanjutiPada` dan `ditindaklanjutiOlehId` dikosongkan.
- Penyusun atau PJ Penyusun hanya boleh menandai tindak lanjut `SELESAI` jika `hasil = PERLU_PERBAIKAN`, `statusTindakLanjut = TERBUKA`, dan `DetailSOP` sedang `REVISI_DARI_EVALUATOR`.
- Pengajuan hanya boleh diselesaikan evaluator jika seluruh hasil sudah `SESUAI`.
- `LogNilaiEvaluasi` mencatat perubahan hasil, catatan, dan status tindak lanjut.

## Invariant OPD Pengajuan dan SOP

Semua `NilaiEvaluasi.detailSopId` dalam satu `PengajuanEvaluasi` harus berasal dari OPD yang sama dengan `PengajuanEvaluasi.opdId`.

Aturan ini dijaga oleh service saat pengajuan dibuat:

- Detail SOP wajib ditemukan pada OPD pengguna/pengajuan.
- Detail SOP wajib berada pada status `MENUNGGU_PENGAJUAN_EVALUASI`.
- Satu OPD tidak boleh punya lebih dari satu pengajuan aktif lintas jobdesk.
- Pengecekan pengajuan aktif dan pembuatan pengajuan baru diserialisasi per OPD. `PengajuanEvaluasiRepository.runTransaction(..., opdId)` mengambil row lock `SELECT ... FOR UPDATE` pada baris `OPD` sebelum membaca pengajuan blocking, sehingga dua request paralel untuk OPD yang sama tidak dapat sama-sama melewati pengecekan.

Invariant concurrency ini diuji terhadap MariaDB nyata pada `test/integration/database-invariants.integration-spec.ts`: dua request paralel untuk OPD yang sama harus menghasilkan tepat satu pengajuan aktif dan satu request konflik.

## Invariant Pelaksana dan Langkah SOP

Target semantics Sprint 4:

- `Pelaksana` adalah katalog aktor prosedur global yang reusable. Identity katalog tidak dimiliki OPD, Department, Faculty, Process, atau Process Team.
- `Pelaksana.nama` unik secara global melalui index migration `Pelaksana_nama_global_key`.
- `Pelaksana.opdId` masih ada sebagai compatibility shadow legacy. Field ini bukan lagi ownership/authorization boundary untuk target Process-bound procedure path.
- Exact duplicate lintas OPD dikonsolidasikan hanya berdasarkan normalized identity `LOWER(TRIM(nama))`; migration tidak melakukan fuzzy/semantic merge untuk near-duplicate yang ambigu.
- Riwayat creator/editor lama yang tidak diketahui tidak boleh difabrikasi. `PelaksanaAuditAttribution.createdById` dan `updatedById` boleh `NULL` untuk legacy rows; mutation baru menyimpan attribution aktual.
- Pemakaian Pelaksana pada satu versi SOP direpresentasikan oleh `DetailSOPPelaksana`; ini adalah usage relationship, bukan ownership katalog.
- `DetailSOPPelaksanaSnapshot.namaSnapshot` menyimpan label stabil pada document-version boundary. Perubahan nama katalog setelah itu tidak boleh mengubah wording historis/versioned SOP.
- `LangkahSOP.pelaksanaId` wajib menunjuk Pelaksana yang sudah dipilih pada `DetailSOPPelaksana` untuk `detailSopId` yang sama. Invariant ini dikunci oleh trigger `trg_langkahsop_pelaksana_swimlane_insert` dan `trg_langkahsop_pelaksana_swimlane_update`.
- Trigger legacy yang memaksa Pelaksana se-OPD dengan SOP (`trg_detailsoppelaksana_pelaksana_opd_*` dan `trg_langkahsop_pelaksana_opd_*`) dipensiunkan pada migration Sprint 4 sebelum cross-OPD duplicate references direwire.
- `LangkahSOP.langkahSelanjutnyaYaId` dan `langkahSelanjutnyaTidakId`, jika terisi, harus menunjuk langkah pada `DetailSOP` yang sama.
- Untuk payload prosedur, service memastikan `KEPUTUSAN` hanya menerima cabang Ya/Tidak yang merujuk langkah dikenal, sedangkan non-keputusan tidak memakai cabang.

## Invariant SopTerkait

`SopTerkait` tidak boleh menunjuk dirinya sendiri. Relasi dua arah diperbolehkan karena UI memperlakukan keterkaitan SOP sebagai informasi yang bisa dimasukkan dari kedua sisi.

## Invariant DokumenTte dan Tanda Tangan

- `DokumenTte` wajib memiliki tepat satu parent: `detailSopId` atau `pengajuanEvaluasiId`.
- Kondisi kedua parent kosong maupun kedua parent terisi ditolak oleh CHECK constraint migration dan diverifikasi oleh dedicated negative integration test.
- `DokumenTte.nomorDokumen` unik global.
- `PengajuanEvaluasi.nomorBA` unik global saat terisi; nilai `NULL` diperbolehkan untuk pengajuan yang belum memiliki BA.
- Satu dokumen hanya boleh memiliki satu tanda tangan per peran melalui unique `(dokumenTteId, peran)`.
- `RiwayatTandaTangan.peran` adalah snapshot peran saat tanda tangan.
- `DokumenTte.judulDokumen`, `nomorDokumen`, dan `hashDokumen` adalah snapshot legal dokumen saat legalisasi.

## Verifikasi Migration-backed

Constraint yang berasal dari raw SQL migration—termasuk trigger dan CHECK constraint—tidak boleh dianggap terbukti hanya dengan `prisma db push`, `prisma validate`, atau `prisma generate`, karena perintah tersebut tidak mereplay historical raw migration SQL terhadap engine database nyata.

Dedicated Migration Smoke menjalankan full committed migration chain pada runtime-matched MariaDB 11.4 dengan `--lower_case_table_names=1`, memverifikasi `prisma migrate status`, memastikan tidak ada unresolved failed migration, dan menjalankan assertion terhadap critical raw-SQL invariants. Gate ini path-scoped untuk migration/schema/config changes dan bukan full application integration suite.

Untuk Process foundation, Migration Smoke wajib membuktikan trigger `trg_process_scope_department_insert` dan `trg_process_scope_department_update` menerima kombinasi scope/context valid serta menolak INSERT/UPDATE invalid.

Untuk Sprint 4, targeted migration rehearsal boleh menggunakan Sprint-3 schema baseline yang dimaterialisasi dengan `db push`, **hanya** untuk membentuk pre-migration relational shape; legacy Pelaksana triggers yang relevan harus dipasang eksplisit, lalu migration Sprint 4 sendiri wajib dijalankan oleh Prisma migrate engine dan diverifikasi dengan assertion terhadap dedup/rewrite/snapshot/global uniqueness/new swimlane trigger. Ini tidak menggantikan full historical migration-chain health.

Broad Prisma-schema-versus-database drift saat ini memiliki historical baseline terpisah dan tidak menjadi required Migration Smoke gate sampai baseline tersebut dibersihkan. Jangan menyamakan drift debt itu dengan kegagalan mengeksekusi migration chain.
