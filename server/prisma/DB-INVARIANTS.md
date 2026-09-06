# Invariant Database dan Transisi Status

Dokumen ini merangkum aturan bisnis yang tidak cukup dijelaskan oleh foreign key biasa. Sebagian aturan dikunci oleh trigger/migration database, sebagian oleh service transaction, dan sebagian menjadi kontrak domain untuk laporan tugas akhir.

## Sumber Kebenaran OPD Aktif Pengguna

`Pengguna.opdId` adalah compatibility shadow nullable untuk legacy OPD workflow. Native FTI accounts may have no OPD; target authorization must use `platformRole`, Process relationship, and Organizational Authority instead.

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
- Target Process boleh memiliki nol atau lebih `ProcessMember`. Membership ditambahkan secara eksplisit oleh Process Owner; composite primary key `(processId, penggunaId)` mencegah membership duplikat.
- Process Owner tidak diduplikasi sebagai `ProcessMember`; owner dan member adalah dua relationship contextual yang berbeda.
- Owner dan seluruh member yang ditugaskan harus merupakan pengguna aktif pada saat mutasi Process.
- Assignment pada Process A tidak memberikan relationship pada Process B.

### Process Owner Self-Service

`ProcessOwnerAuthority` adalah axis eligibility terpisah yang hanya menjawab apakah satu `USER` boleh membuat dan menjadi owner awal Process pada scope tertentu. Ia bukan `PlatformRole`, bukan `OrganizationalAuthority`, dan bukan kewenangan TTE.

- Admin Platform boleh grant/revoke eligibility pada scope `FACULTY` atau satu `DEPARTMENT` tertentu.
- `scopeKey` menormalisasi uniqueness nullable scope menjadi `FACULTY` atau `DEPARTMENT:<departmentId>`; satu user tidak memiliki dua authority aktif untuk scope yang sama.
- Process target yang dibuat lewat self-service selalu memakai caller sebagai `ownerId`; client tidak memilih owner arbitrer.
- Nama Process harus unik pada organizational scope yang sama sebelum aktivasi.
- `ProcessLifecycle` memisahkan lifecycle operasional dari ownership schema yang sudah ada. Existing Process di-backfill `ACTIVE`; archive tidak menghapus `Process`, membership history, SOP, review, TTE, publication, atau audit evidence.
- Process `ARCHIVED` tidak menerima authoring/review baru. Archive ditolak bila masih ada `DetailSOP` nonterminal agar workflow tidak ditinggalkan dalam keadaan ambigu.
- `ProcessInvitation` menyimpan hanya SHA-256 token onboarding, bukan token plaintext. Token plaintext diberikan satu kali kepada Process Owner untuk diteruskan kepada invitee.
- Invitee membuat kata sandinya sendiri saat aktivasi. Process Owner tidak menetapkan atau menyimpan password anggota.
- Jika email sudah menunjuk akun aktif, account identity yang sama harus dipakai dan hanya membership Process yang ditambahkan; duplicate account tidak dibuat.
- `ProcessAudit` adalah append-only evidence untuk grant/revoke owner eligibility, create/rename/archive Process, add/remove member, dan invitation lifecycle yang diimplementasikan.

Native FTI SOP ownership is stored directly in nullable `SOP.processId`. A non-null value must reference an existing `Process`; target authoring, procedure mutation, versioning, review, approval, TTE, notification, revocation, and public discovery resolve from that relationship. `ProcessSopBinding` is retained only as historical/backfill evidence and an explicit compatibility boundary; it is not an active lookup.

The M11 ownership migration follows `EXPAND -> BACKFILL -> CUTOVER -> PROVE -> CONTRACT`:

- `EXPAND` adds nullable `SOP.processId` and makes `Pengguna.opdId` nullable without deleting legacy columns;
- `BACKFILL` copies each existing `ProcessSopBinding.processId` to its SOP;
- `CUTOVER` routes native runtime reads/writes through `SOP.processId`;
- `PROVE` checks the native foreign key, zero unbackfilled bindings, zero ownership mismatches, and zero orphan Process references in Migration Smoke;
- `CONTRACT` remains a later, separately authorized cleanup of compatibility schema/history.

## Contextual Final Approval

- `OrganizationalAuthorityAssignment` menyimpan holder kewenangan organisasi yang aktif untuk final approval target-path.
- Authority `DEAN` berlaku untuk Process scope `FACULTY`.
- Authority `HEAD_OF_DEPARTMENT` selalu dikunci ke satu `departmentId` dan hanya berlaku untuk Process scope `DEPARTMENT` pada Department tersebut.
- `SUPER_ADMIN` boleh memelihara konfigurasi authority, tetapi `platformRole = SUPER_ADMIN` tidak memberikan hak final approval dan tidak boleh menjadi workflow bypass.
- `ProcessFinalApproval` adalah evidence satu-per-`DetailSOP` bahwa holder authority yang ter-resolve menyetujui versi SOP Process-bound tersebut.
- `ProcessFinalApproval.processReviewId` menghubungkan approval baru dengan evidence `ProcessReview` berkeputusan `ACCEPT` dan status tujuan `MENUNGGU_TTD_PJ_EVALUATOR`; kolom tetap nullable selama fase EXPAND agar approval native historis tidak perlu dipalsukan atau di-backfill tanpa bukti.
- Hanya versi `DetailSOP` terbaru dari SOP Process-bound yang dapat memperoleh contextual final approval. Versi lama yang pernah berada pada status siap approval ditolak setelah versi yang lebih baru tersedia.
- SOP dengan `SOP.processId IS NULL` tetap berada pada compatibility workflow dan tidak masuk contextual final-approval path.
- Final approval tidak membuat `DetailSOP` menjadi `BERLAKU`. TTE dan effective-state transition tetap merupakan boundary terpisah.

## Transisi Status DetailSOP

SOP Process-bound memakai lifecycle native Process Owner -> contextual authority
-> TTE -> published/revoked. Status dan evidence aktifnya dimiliki oleh
`ProcessReview`, `ProcessFinalApproval`, `DokumenTte`, `ProcessNotification`,
dan `ProcessReminder`.

Status legacy evaluasi dan `PengajuanEvaluasi` masih dipertahankan hanya sebagai
parent historis yang belum dihapus. Tidak ada service/controller aktif yang
membuat nilai evaluasi, log nilai, BA evaluasi, atau reminder WhatsApp baru.
`fti-baseline-audit.ts` tidak lagi menganggap tabel legacy tersebut sebagai
source of truth.

Database juga menjaga maksimal satu `DetailSOP.BERLAKU` per `SOP`.

## Evidence Process Owner Review

`ProcessReview` adalah evidence append-only untuk keputusan Process Owner pada SOP yang sudah terikat Process.

- setiap review native menyimpan `detailSopId`, `sopId`, `processId`, dan `reviewedById` secara eksplisit;
- `decision`, `previousStatus`, dan `nextStatus` menyimpan keputusan serta transisi yang benar-benar diproses;
- perubahan status `DetailSOP`, pembuatan `ProcessReview`, dan notifikasi native harus berada dalam satu transaksi;
- foreign key ke `DetailSOP`, `SOP`, `Process`, dan `Pengguna` memakai `RESTRICT` agar evidence tidak ikut hilang ketika data induk dipelihara;
`PengajuanEvaluasi` hanya merupakan parent historis. Status/version legacy yang
masih tersimpan tidak menjadi workflow aktif dan tidak boleh dipakai untuk
otorisasi atau notifikasi baru.

## Retirement Legacy Evaluation dan WhatsApp

Migration `20260906120000_retire_legacy_evaluation_and_whatsapp` mengganti nama
tabel berikut ke nama arsip yang jelas dan reversible:

- `NilaiEvaluasi` -> `_retired_NilaiEvaluasi_20260906`;
- `LogNilaiEvaluasi` -> `_retired_LogNilaiEvaluasi_20260906`;
- `PengingatWhatsApp` -> `_retired_PengingatWhatsApp_20260906`;
- `NotifikasiInApp` -> `_retired_NotifikasiInApp_20260906`.

Rows historis dipertahankan untuk retention/legal review, tetapi tabel arsip
bukan source of truth aplikasi. Source of truth aktif adalah Process-native
review, notification, reminder, approval, dan TTE.

## Invariant Reminder Native Process

`ProcessReminder` adalah state operasional mutable untuk SOP yang sudah terikat
Process. `ProcessNotification` tetap menjadi histori event dan read-state; kedua
tabel tidak boleh dipakai sebagai substitusi diam-diam satu sama lain.

- setiap reminder harus menunjuk ke `DetailSOP`, `SOP`, `Process`, dan penerima
  yang ada;
- `DetailSOP.sopId` harus sama dengan `ProcessReminder.sopId`, dan
  `SOP.processId` harus sama dengan `ProcessReminder.processId`;
- reminder hanya dibuat untuk status native yang sesuai: `PROCESS_OWNER_REVIEW`
  untuk `SEDANG_DIEVALUASI`, `PROCESS_REVISION` untuk `REVISI_DARI_EVALUATOR`,
  dan `FINAL_APPROVAL` untuk `MENUNGGU_TTD_PJ_EVALUATOR`;
- satu versi, penerima, dan jenis reminder hanya boleh memiliki satu state aktif
  melalui unique key `(detailSopId, penggunaId, kind)`;
- transisi native yang actionable mengganti state reminder lama dalam transaksi
  yang sama dengan event notification; efektivitas atau pencabutan menghapus
  state reminder aktif untuk versi tersebut;
- `destinationPhone`, lock, retry, dan failure fields adalah operational state,
  bukan bukti bahwa pengiriman berhasil.

`fti-baseline-audit.ts` memeriksa orphan/mismatch native reminder secara
read-only. Pada database yang belum memasang migration native reminder, check
ini bersifat kompatibilitas dan bernilai nol; status migrasi tetap harus
diverifikasi terpisah oleh `prisma migrate status`.

## Invariant OPD Historis

`PengajuanEvaluasi` dan `opdId` pada parent legacy dipertahankan untuk
retention/backward inspection saja. Tidak ada invariant aplikasi aktif yang
mengizinkan pembuatan nilai evaluasi atau reminder baru pada parent tersebut.
Workflow baru wajib menggunakan relasi Process dan evidence native.

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

- `DokumenTte` historis wajib memiliki tepat satu parent: `detailSopId` atau `pengajuanEvaluasiId`.
- Artifact TTE native yang parent-nya `detailSopId` dan SOP-nya sudah terikat Process menyimpan `processId` yang sama; kolom tetap nullable untuk histori lama.
- TTE Process-native menolak artifact yang masih memakai parent legacy evaluasi; TTE BA evaluasi legacy sudah retired.
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
