# SOPFlow Project

This file is the canonical owner for **WHY + WHAT**: product purpose, committed behavior, scope, contracts, ownership semantics, non-goals, and unresolved product questions.

Architecture belongs in `ARCHITECTURE.md`; current milestone state belongs in `CURRENT_ITERATION.md`; implementation conventions belong in `CODE_PATTERNS.md`; verification belongs in `QUALITY.md`; durable rationale belongs in `DECISIONS.md`.

## Purpose

SOPFlow is an SOP lifecycle system for Fakultas Teknologi Informasi (FTI). It supports SOP creation, Proses Bisnis-level review, TTE signing, publication, verification, revocation, and version lifecycle.

The target product domain is FTI. Legacy Indonesian government/OPD terminology still exists in compatibility code and persisted data, but it is not the target product model.

The committed end state is **Full FTI**: active FTI product behavior must not depend on OPD identity, OPD ownership, or legacy global workflow roles. Legacy concepts may survive only as explicit migration/historical compatibility boundaries until their contracts are safely retired.

## Product Model

Core mental model:

```text
Entitas Akademik (Fakultas / Jurusan)
  -> Proses Bisnis
       -> satu Pemilik Proses
       -> Penyusun SOP yang ditambahkan oleh Pemilik Proses
       -> SOP
             -> review oleh Pemilik Proses atau reviewer pengganti
             -> diteruskan ke Pejabat TTE sesuai lingkup Proses Bisnis
             -> TTE
            -> Published / Effective Version
            -> Contextual Revocation
```

Jangan menggabungkan jabatan organisasi, hubungan Proses Bisnis, authorship,
review, kewenangan TTE, pencabutan, dan administrasi platform menjadi satu role.

Target academic vocabulary:

- `Entitas Akademik` means Fakultas or Jurusan;
- `Proses Bisnis` means the business/operational process owned by an Entitas Akademik;
- `Pemilik Proses` is the accountable owner and reviewer for one Proses Bisnis;
- `Penyusun SOP` is an explicitly assigned account that drafts and maintains SOP content for a Proses Bisnis;
- `Pejabat TTE` means Dekan for a Fakultas-scoped Proses Bisnis or Ketua Jurusan/Kadep for a Jurusan-scoped Proses Bisnis;
- `Admin Platform` manages global accounts, struktur organisasi, dan governance khusus; Admin Platform bukan pembuat rutin membership Proses Bisnis.

## Authorization Dimensions

These dimensions are independent:

```text
Platform Role
  -> SUPER_ADMIN | USER

Hubungan Proses Bisnis
  -> PROCESS_OWNER / Pemilik Proses | MEMBER / Penyusun SOP | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

A person may hold capabilities in multiple dimensions. Permission must come from the dimension relevant to the action.

`SUPER_ADMIN` is not a workflow bypass.

## Proses Bisnis (Process)

Proses Bisnis adalah satu rangkaian kegiatan operasional FTI. Satu entitas,
baik Fakultas maupun Jurusan, dapat memiliki banyak Proses Bisnis. Satu Proses
Bisnis hanya berada pada satu entitas dan memiliki tepat satu Pemilik Proses
(Process Owner).

Committed semantics:

- setiap Proses Bisnis memiliki satu lingkup organisasi canonical: `FACULTY` atau `DEPARTMENT`;
- Proses Bisnis dengan lingkup `DEPARTMENT` terikat pada tepat satu Jurusan;
- setiap Proses Bisnis memiliki satu nama dan identitas canonical yang dikelola sebagai master data;
- satu Fakultas atau Jurusan dapat memiliki banyak Proses Bisnis;
- setiap Proses Bisnis memiliki tepat satu Pemilik Proses dan nol atau lebih Penyusun SOP yang ditambahkan secara eksplisit;
- Proses Bisnis bukan sinonim dari Fakultas atau Jurusan.

### Pemilik Proses (Process Owner)

Admin Platform menetapkan pengguna yang boleh menjadi Pemilik Proses dalam
lingkup Fakultas atau Jurusan. Pemilik Proses yang telah diberi kewenangan
dalam lingkup tersebut dapat membuat nama dan identitas Proses Bisnis. Pengguna
yang mendaftarkan Proses Bisnis menjadi Pemilik Proses awal dan dapat memiliki
banyak Proses Bisnis.

Pemilik Proses:

- bertanggung jawab atas Proses Bisnis;
- membuat dan mengelola data dasar Proses Bisnis dalam lingkupnya;
- membuat atau mengundang akun anggota untuk Proses Bisnis tersebut;
- menambahkan dan menghapus Penyusun SOP pada Proses Bisnisnya;
- menerima pengajuan SOP untuk Proses Bisnis tersebut;
- melakukan review dan meminta perbaikan;
- meng-acc hasil review dan meneruskan SOP kepada pejabat TTE;
- tidak mengubah isi SOP secara langsung ketika melakukan review;
- tidak boleh meng-acc SOP yang dibuatnya sendiri.

Pemilik Proses bukan evaluator tingkat Fakultas dan tidak otomatis memiliki
akses ke Proses Bisnis lain.

### Akun Anggota dan Penyusun SOP

Akun anggota yang dibuat atau diundang oleh Pemilik Proses hanya memperoleh
akses ke Proses Bisnis yang dipilih. Akses tersebut tidak memberikan akses ke
Proses Bisnis lain, seluruh Jurusan, atau seluruh Fakultas.

Dalam target model, akun anggota yang diberi akses kerja adalah Penyusun SOP.
Penyusun SOP dapat membuat dan memperbaiki SOP dalam Proses Bisnis tersebut,
sesuai status workflow. Anggota lain tidak dapat menambahkan dirinya sendiri
atau pengguna lain ke Proses Bisnis.

Role assignment is contextual, not globally exclusive:

- satu pengguna dapat menjadi Pemilik Proses untuk banyak Proses Bisnis dalam lingkup yang diberi kewenangan;
- satu pengguna dapat menjadi Pemilik Proses untuk Proses Bisnis A dan Penyusun SOP untuk Proses Bisnis B hanya jika ditambahkan secara eksplisit ke Proses Bisnis B;
- satu akun dapat memiliki akses eksplisit ke beberapa Proses Bisnis, tetapi setiap membership diberikan dan diaudit secara terpisah;
- penambahan akun ke satu Proses Bisnis tidak boleh mengubah identitas akun atau memberikan akses ke Proses Bisnis lain;
- an author may view and edit their own drafts and revisions, but may not edit another author's SOP unless explicitly added as a co-author;
- if the Pemilik Proses authored a submitted SOP, another explicitly assigned Penyusun SOP must review it;
- if no independent reviewer is available for an owner-authored SOP, submission is blocked until one is assigned;
- a Pejabat TTE account must not be assigned as Pemilik Proses or Penyusun SOP for target workflow work solely because of its official authority.

### Pengelolaan Proses dan Akun secara Lean

```text
Admin Platform
  -> membangun struktur Fakultas dan Jurusan satu kali
  -> menetapkan pengguna yang boleh menjadi Pemilik Proses dalam suatu lingkup

Pemilik Proses
  -> membuat nama dan identitas Proses Bisnis
  -> membuat atau mengundang akun anggota untuk Proses tersebut
  -> menambahkan akun sebagai Penyusun SOP

Penyusun SOP
  -> mengakses Proses yang ditugaskan
  -> membuat SOP tanpa assignment ulang untuk setiap SOP
```

Committed access and assignment rules:

- Pemilik Proses dapat membuat satu atau lebih Proses Bisnis hanya dalam lingkup yang diberikan Admin Platform;
- pembuatan Proses Bisnis dan penetapan Pemilik Proses awal terjadi dalam satu aksi setup;
- Pemilik Proses dapat membuat atau mengundang akun anggota tanpa meminta Admin Platform menambahkan membership satu per satu;
- akun baru yang dibuat melalui Pemilik Proses tidak boleh memperoleh platform role, kewenangan TTE, atau akses di luar Proses Bisnis tersebut;
- pembuatan akun dan membership Proses Bisnis tetap merupakan dua hal berbeda: akun harus diverifikasi sebelum dapat melakukan tindakan workflow;
- Pemilik Proses dapat menambahkan akun aktif yang tersedia atau mengundang pengguna melalui mekanisme onboarding yang disediakan platform;
- hanya Pemilik Proses yang dapat menambah atau mencabut akses anggota/Penyusun SOP pada Proses Bisnis tersebut;
- anggota yang ditambahkan hanya memiliki akses ke Proses Bisnis yang dipilih dan tidak otomatis dapat melihat Proses Bisnis lain;
- Pemilik Proses tidak dapat mengubah Proses Bisnis dari lingkup Fakultas ke lingkup Jurusan, memindahkannya antar-Jurusan, atau mengubah kewenangan TTE;
- lingkup Proses Bisnis diturunkan dari lingkup tempat Pemilik Proses diberi kewenangan untuk mendaftarkannya;
- nama dan identitas Proses Bisnis harus unik dalam lingkup yang berlaku, dengan pemeriksaan duplikasi sebelum aktivasi;
- Proses Bisnis menjadi `ACTIVE` setelah data wajib lengkap dan identitasnya lolos pemeriksaan duplikasi;
- Proses Bisnis yang sudah memiliki SOP tidak dapat dihapus; Proses Bisnis yang tidak digunakan harus dinonaktifkan atau diarsipkan dengan alasan;
- Proses Bisnis yang dinonaktifkan atau diarsipkan tidak menerima SOP baru, sedangkan riwayat SOP dan audit trail tetap tersedia;
- Penyusun SOP dapat membuat SOP baru untuk Proses Bisnis yang ditugaskan kepadanya tanpa assignment ulang per SOP;
- hanya Pemilik Proses dan Penyusun SOP yang ditugaskan secara eksplisit yang memiliki akses operasional ke Proses Bisnis dan SOP kerjanya;
- Pejabat TTE tetap memiliki akses baca dan TTE pada SOP dalam lingkup organisasinya, meskipun bukan Anggota Proses;
- Admin Platform tetap memiliki akses khusus untuk menonaktifkan akun, memperbaiki assignment, mengganti Pemilik Proses, menonaktifkan atau menggabungkan Proses Bisnis, dan mengubah lintas lingkup;
- akun anggota yang dibuat atau diundang oleh Pemilik Proses harus memiliki identitas unik dan harus diverifikasi sebelum dapat melakukan workflow;
- akun anggota baru hanya memperoleh akses ke Proses Bisnis tempat akun tersebut dibuat atau diundang;
- akun anggota tidak memperoleh `SUPER_ADMIN`, kewenangan TTE, atau akses Fakultas/Jurusan secara otomatis;
- pembuatan akun anggota menggunakan undangan atau onboarding; Pemilik Proses tidak menetapkan atau menyimpan kata sandi anggota;
- jika identitas akun sudah ada, sistem harus menghubungkan akun yang sama dan tidak membuat akun duplikat;
- akun yang belum menerima atau memverifikasi undangan tidak dapat melihat data kerja atau melakukan workflow;
- satu akun dapat memiliki akses ke beberapa Proses Bisnis hanya melalui assignment eksplisit dari masing-masing Pemilik Proses;
- pemindahan akses akun berarti mencabut assignment dari Proses Bisnis lama dan/atau menambahkan assignment ke Proses Bisnis baru; identitas akun tidak berubah;
- pencabutan akses akun memblokir akses dan tindakan authoring baru, tetapi tidak mengubah riwayat authorship, review, TTE, atau audit evidence;
- semua pembuatan Proses Bisnis, penetapan owner, pembuatan/invitasi akun, perubahan membership, perubahan lingkup, dan pengarsipan harus diaudit.

This model keeps governance lean: Admin Platform assigns the accountable
Pemilik Proses once, while each Pemilik Proses creates the Proses Bisnis and
manages its own Penyusun SOP. No central-admin ticket or per-SOP assignment is
needed for normal authoring work.

## Pejabat TTE

There are exactly two current official scopes for TTE:

```text
FACULTY
  -> DEAN / Dekan

DEPARTMENT
  -> HEAD_OF_DEPARTMENT / Ketua Jurusan (Kadep)
```

Jurusan berada dalam satu Fakultas. Unit di bawah Fakultas atau Jurusan tidak
membuat lingkup TTE tambahan.

Pejabat TTE tidak membuat atau melakukan review SOP dalam alur target. Pejabat
dapat:

- melihat Proses Bisnis dan SOP dalam lingkup organisasinya;
- melihat SOP yang dikelompokkan berdasarkan Proses Bisnis;
- melakukan TTE pada SOP setelah diteruskan oleh Pemilik Proses.

Kewenangan TTE ditentukan dari lingkup Proses Bisnis dan tidak dikonfigurasi
sebagai penandatangan sembarang pada setiap SOP.

Pejabat tidak memiliki jalur penolakan TTE. Setelah SOP diteruskan oleh
Pemilik Proses, hasil bisnis yang diharapkan adalah TTE berhasil dan SOP
menjadi `BERLAKU`. Jika layanan atau kredensial TTE mengalami kegagalan
teknis, SOP tetap berada pada status `MENUNGGU_TTE` dan dapat dicoba kembali.
Kegagalan teknis bukan penolakan terhadap isi SOP.

## Revocation

Pencabutan SOP yang terikat pada Proses Bisnis menggunakan lingkup kewenangan
organisasi yang sama dengan kewenangan TTE:

```text
FACULTY
  -> active DEAN / Dekan

DEPARTMENT
  -> active HEAD_OF_DEPARTMENT / Ketua Jurusan (Kadep) for that Jurusan
```

Committed semantics:

- only a currently `BERLAKU` version may be revoked;
- a revision in flight blocks revocation until the version lifecycle is no longer ambiguous;
- Pemilik Proses, Penyusun SOP, dan `SUPER_ADMIN` tidak memperoleh kewenangan pencabutan hanya dari capability tersebut;
- successful revocation transitions the effective version to `DICABUT`;
- revocation removes current/effective/public availability but preserves version history, approval evidence, TTE evidence, signed artifact history, and audit evidence;
- revocation does not automatically create a new draft/replacement version;
- legacy/unbound SOP may keep compatibility revocation behavior until that path is explicitly retired.

## Canonical SOP Workflow

Target behavior:

```text
Penyusun SOP
  -> membuat atau melanjutkan draf
  -> mengirim SOP untuk review Pemilik Proses

Pemilik Proses
  -> meminta perbaikan
  -> atau meng-acc hasil review dan meneruskan SOP kepada pejabat TTE

Pejabat TTE
  -> FACULTY: Dekan
  -> DEPARTMENT: Ketua Jurusan (Kadep) terkait
  -> melihat SOP yang dikelompokkan berdasarkan Proses Bisnis dalam lingkupnya
  -> melakukan TTE
  -> SOP menjadi berlaku dan dipublikasikan
```

Behavioral invariants:

1. hak penyusunan SOP berasal dari assignment Penyusun SOP pada Proses Bisnis yang relevan;
2. review SOP menjadi tanggung jawab Pemilik Proses, kecuali SOP dibuat oleh Pemilik Proses sendiri dan telah ditetapkan reviewer pengganti;
3. review dapat mengembalikan SOP untuk perbaikan;
4. review yang sudah di-acc diteruskan kepada pejabat yang berwenang untuk TTE;
5. pejabat hanya melakukan TTE; tidak ada keputusan bisnis `TTE_DITOLAK`;
6. kegagalan teknis TTE mempertahankan status `MENUNGGU_TTE` dan tidak mengubah isi atau hasil review;
7. kewenangan TTE ditentukan secara jelas dari lingkup Fakultas atau Jurusan;
8. kewenangan penandatanganan TTE mengikuti pejabat yang berwenang dalam lingkup tersebut;
9. pencabutan tetap merupakan capability lifecycle terpisah dan bukan jalur penolakan dalam workflow TTE;
10. produk mempertahankan bukti versi, publikasi, audit, dan legal kecuali diubah secara eksplisit.

Persisted legacy status names may remain during migration when product behavior is already target-native.

## Workflow Constraints

The following constraints define when an actor may perform an action and what must happen when the action succeeds or fails.

### Transisi Status

Workflow Proses Bisnis mengikuti state model berikut:

```text
DRAFT
  -> MENUNGGU_REVIEW
  -> PERLU_PERBAIKAN
  -> MENUNGGU_REVIEW
  -> REVIEW_DISETUJUI
  -> MENUNGGU_TTE
  -> BERLAKU
```

Committed transition rules:

- Penyusun SOP hanya dapat membuat dan mengedit SOP berstatus `DRAFT` atau `PERLU_PERBAIKAN` pada Proses Bisnis yang telah ditugaskan kepadanya;
- hanya Penyusun SOP yang ditugaskan pada SOP tersebut yang dapat mengirim draft lengkap ke `MENUNGGU_REVIEW`;
- Pemilik Proses mereview submission apabila penyusunnya adalah Penyusun SOP lain;
- apabila Pemilik Proses menjadi penyusun SOP, satu Penyusun SOP lain yang ditugaskan secara eksplisit dapat ditunjuk sebagai reviewer untuk submission tersebut;
- reviewer pengganti dapat mengubah `MENUNGGU_REVIEW` menjadi `PERLU_PERBAIKAN` atau `REVIEW_DISETUJUI`, tetapi tidak boleh mereview SOP yang dibuatnya sendiri;
- pengembalian untuk perbaikan wajib menyertakan catatan perbaikan yang tidak kosong;
- hanya submission `REVIEW_DISETUJUI` yang masih terbaru yang dapat berpindah ke `MENUNGGU_TTE`;
- hanya Dekan atau Ketua Jurusan/Kadep yang ter-resolve sesuai lingkup dapat melakukan TTE pada `MENUNGGU_TTE`;
- hanya finalisasi TTE yang berhasil yang dapat mengubah versi menjadi `BERLAKU`;
- workflow tidak boleh menyediakan perpindahan langsung dari author ke TTE atau dari author ke status berlaku;
- kegagalan layanan atau kredensial TTE mempertahankan versi pada `MENUNGGU_TTE` dan mengizinkan percobaan ulang tanpa keputusan penolakan bisnis;
- koreksi isi setelah review di-acc harus mengembalikan versi ke jalur penyusunan/review sebelum TTE.

### Penyusunan, Review, dan Pemisahan Tugas

- setiap Proses Bisnis harus memiliki tepat satu Pemilik Proses aktif sebelum submission dapat direview;
- Pemilik Proses boleh menjadi Penyusun SOP pada Proses Bisnisnya sendiri, tetapi tidak boleh mereview atau meng-acc SOP yang dibuatnya sendiri;
- Pemilik Proses dapat menjadi Penyusun SOP pada Proses Bisnis lain hanya jika ditambahkan secara eksplisit oleh Pemilik Proses tersebut;
- Pemilik Proses tidak boleh mengedit, memperbaiki diam-diam, atau mengirimkan isi SOP yang sedang direview;
- Penyusun SOP tidak boleh meng-acc review atas SOP yang dibuatnya sendiri;
- sistem harus memblokir submission jika reviewer yang independen tidak dapat ditentukan;
- pengguna yang dihapus dari assignment Proses atau capability Penyusun SOP kehilangan akses untuk tindakan baru, sedangkan riwayat authorship tetap dipertahankan.

### Validasi Submission dan Penguncian

Sebelum draft masuk ke `MENUNGGU_REVIEW`, sistem harus memvalidasi identitas SOP, Proses Bisnis, tujuan/ruang lingkup, langkah prosedur, Pelaksana pada setiap langkah, serta lampiran atau peraturan yang diwajibkan. Pejabat TTE yang diperlukan untuk Proses Bisnis tersebut juga harus dapat ter-resolve.

After submission:

- isi submission dikunci dari perubahan Penyusun SOP selama berstatus `MENUNGGU_REVIEW`;
- `PERLU_PERBAIKAN` membuka kembali penyusunan dan mencatat putaran review baru saat dikirim ulang;
- `REVIEW_DISETUJUI` dan `MENUNGGU_TTE` mengunci isi serta artefak resmi;
- versi yang telah di-acc atau sedang menunggu TTE tidak dapat diedit di tempat;
- versi `BERLAKU` yang telah ditandatangani bersifat immutable dan setiap perubahan wajib menggunakan versi baru.

### Kewenangan TTE dan Finalisasi

- lingkup Proses Bisnis harus mengarah tepat ke satu pejabat yang berwenang: `FACULTY -> DEAN/Dekan` atau `DEPARTMENT -> HEAD_OF_DEPARTMENT/Ketua Jurusan (Kadep)`;
- pejabat hanya dapat melihat dan menandatangani versi SOP yang terikat pada Proses Bisnis dalam lingkup kewenangannya;
- pejabat tidak dapat memilih penandatangan sembarang untuk setiap SOP;
- TTE harus mengikat bukti penandatanganan ke versi SOP yang sudah di-acc dan artefak PDF resmi yang tepat;
- keberhasilan TTE, perubahan ke `BERLAKU`, finalisasi artefak resmi, dan notifikasi efektivitas harus tercatat sebagai satu hasil bisnis;
- kegagalan teknis TTE tidak boleh membuat `TTE_DITOLAK`, tidak boleh mempublikasikan SOP, dan harus membuat versi dapat dicoba kembali;
- jika pejabat atau kredensial TTE belum tersedia, versi tetap menunggu sampai prasyarat terpenuhi.

### Version, concurrency, and evidence

- a new version starts at `DRAFT` and does not replace the currently `BERLAKU` version until its own review and TTE complete;
- only one version may be the current effective version for a Process at a time;
- a review or TTE action must verify that the actor is acting on the current version and expected status;
- duplicate review submissions and duplicate TTE requests must be idempotent;
- every transition records actor, timestamp, Process, version, previous status, next status, and applicable notes or technical result;
- review notes, TTE evidence, signed-artifact history, publication evidence, and audit evidence are append-only and must not be silently replaced or deleted.

### Operational exceptions

- a draft may be withdrawn or cancelled only before it is submitted for review;
- Pemilik Proses may recall a version from `MENUNGGU_TTE` for correction before TTE, with a recorded reason;
- a recall returns the version to the authoring/review path and invalidates the prior review acceptance for that version;
- notification delivery failure must not roll back a committed business transition;
- perubahan membership Proses Bisnis, Pemilik Proses, lingkup organisasi, atau pejabat berwenang saat versi sedang berjalan tidak boleh diam-diam mengubah bukti atau target penandatangan; sistem harus memblokir perubahan tersebut atau mencatat dan menghitung ulang kewenangannya secara eksplisit.

## Use Case FTI

Bagian ini menjelaskan apa yang dapat dilakukan setiap pengguna dengan bahasa produk sehari-hari.

### Pengguna yang memiliki hubungan dengan Proses Bisnis

- Pengguna dapat melihat Proses Bisnis yang menjadi tanggung jawabnya atau yang secara eksplisit diikutinya sebagai Penyusun SOP.
- Pengguna dapat membuka pekerjaan SOP yang sedang menunggu tindakan mereka.
- Pengguna yang ditugaskan sebagai Penyusun SOP dapat membuat SOP baru untuk Proses Bisnis yang boleh mereka kerjakan.
- Penyusun SOP dapat melanjutkan SOP yang masih berstatus draf.
- Penyusun SOP dapat mengisi informasi dasar SOP.
- Penyusun SOP dapat menyusun langkah-langkah SOP dan menentukan pelaksana setiap langkah.
- Penyusun SOP dapat melengkapi diagram, lampiran, dan peraturan yang berkaitan dengan SOP.
- Penyusun SOP dapat menyimpan perubahan SOP sebagai draf.
- Penyusun SOP dapat mengirim SOP untuk direview oleh Pemilik Proses.
- Pengguna dapat melihat status SOP dan riwayat perubahannya.

### Pemilik Proses

- Pemilik Proses dapat membuat nama dan identitas Proses Bisnis dalam lingkup yang diberikan oleh Admin Platform.
- Pemilik Proses dapat membuat atau mengundang akun anggota untuk Proses Bisnisnya.
- Pemilik Proses dapat menambahkan atau menghapus Penyusun SOP pada Proses Bisnisnya.
- Pemilik Proses dapat melihat semua SOP yang dikirim untuk Proses Bisnis yang menjadi tanggung jawabnya.
- Pemilik Proses dapat membuka dan membaca isi SOP sebelum mengambil keputusan review.
- Pemilik Proses dapat memberikan catatan perbaikan kepada Penyusun SOP.
- Pemilik Proses dapat mengembalikan SOP untuk diperbaiki.
- Pemilik Proses dapat meng-acc hasil review SOP setelah isinya dianggap sesuai.
- Pemilik Proses dapat meneruskan SOP yang sudah di-acc ke pejabat yang berwenang untuk TTE.
- Jika Pemilik Proses menjadi Penyusun SOP, Pemilik Proses dapat menunjuk Penyusun SOP lain sebagai reviewer untuk SOP tersebut.
- Pemilik Proses tidak dapat mengubah isi SOP secara langsung ketika melakukan review.
- Pemilik Proses tidak dapat meng-acc SOP yang dibuatnya sendiri.
- Pemilik Proses dapat melihat apakah SOP sudah di-TTE dan berlaku.

### Penyusun SOP

- Penyusun SOP dapat menerima pemberitahuan ketika SOP dikembalikan untuk diperbaiki.
- Penyusun SOP dapat membaca catatan perbaikan yang diberikan Pemilik Proses.
- Penyusun SOP dapat memperbaiki SOP dan mengirimkannya kembali untuk direview.
- Penyusun SOP dapat melihat hasil review dan tanda tangan elektronik pada SOP.
- Penyusun SOP dapat membuat versi baru dari SOP yang sudah pernah berlaku tanpa menghapus riwayat versi sebelumnya.
- Penyusun SOP tidak dapat mengubah SOP ketika sedang menunggu review atau menunggu TTE.

### Dekan atau Ketua Jurusan (Kadep)

- Dekan dapat melihat SOP dari semua Proses Bisnis dalam lingkup fakultasnya.
- Ketua Jurusan/Kadep dapat melihat SOP dari semua Proses Bisnis dalam lingkup jurusannya.
- Pejabat dapat melihat SOP yang ada di lingkupnya dengan daftar yang dikelompokkan berdasarkan Proses Bisnis.
- Pejabat yang berwenang dapat membaca isi SOP dan memeriksa ringkasan review dari Pemilik Proses.
- Pejabat yang berwenang dapat menyiapkan kredensial tanda tangan elektroniknya.
- Pejabat yang berwenang dapat melakukan TTE pada SOP yang sudah diteruskan oleh Pemilik Proses.
- Dalam alur ini, pejabat tidak membuat, mengubah, atau melakukan review SOP; tindakan utamanya adalah melihat SOP dalam lingkupnya dan melakukan TTE.
- Pejabat tidak memiliki aksi penolakan TTE. Jika proses TTE gagal secara teknis, SOP tetap menunggu TTE dan dapat dicoba kembali.

### Administrator Platform

- Administrator Platform dapat membuat struktur awal fakultas dan departemen FTI.
- Administrator Platform dapat menetapkan pengguna yang boleh menjadi Pemilik Proses dalam lingkup Fakultas atau Jurusan.
- Administrator Platform tidak perlu menambahkan setiap anggota ke setiap Proses Bisnis; penambahan anggota dilakukan oleh Pemilik Proses.
- Administrator Platform dapat membuat dan memperbarui data Proses Bisnis sebagai fungsi setup awal, governance, atau koreksi.
- Administrator Platform dapat menentukan atau memperbaiki apakah Proses Bisnis berada dalam lingkup Fakultas atau Jurusan.
- Administrator Platform dapat mengganti Pemilik Proses atau assignment anggota jika terjadi perubahan organisasi atau assignment yang tidak valid.
- Administrator Platform dapat menggabungkan, menonaktifkan, atau memindahkan Proses Bisnis lintas lingkup sebagai tindakan governance.
- Administrator Platform dapat menetapkan Dekan dan Ketua Jurusan/Kadep yang berwenang.
- Administrator Platform dapat mengelola akun pengguna.
- Administrator Platform dapat mengelola daftar pelaksana yang dapat dipakai pada langkah SOP.
- Administrator Platform dapat melihat konfigurasi dan data yang diperlukan agar alur kerja berjalan.
- Administrator Platform tidak otomatis dapat menulis, meninjau, melakukan TTE, atau mencabut SOP hanya karena memiliki hak administrasi.

### Pengguna umum

- Pengguna umum dapat membuka arsip SOP FTI tanpa harus masuk ke dalam aplikasi.
- Pengguna umum dapat melihat daftar Process berdasarkan lingkup fakultas atau departemen.
- Pengguna umum dapat melihat SOP yang sedang berlaku pada suatu Process.
- Pengguna umum dapat mencari SOP berdasarkan judul, nomor SOP, nama Process, atau nama departemen.
- Pengguna umum dapat membuka pratinjau dokumen SOP resmi.
- Pengguna umum dapat memeriksa keaslian tanda tangan atau dokumen melalui halaman verifikasi.
- Pengguna umum tidak dapat melihat SOP yang sudah dicabut sebagai dokumen yang sedang berlaku.

### Notifikasi dan akun

- Pengguna dapat menerima pemberitahuan ketika ada SOP yang perlu mereka tindak lanjuti.
- Pengguna dapat membuka pemberitahuan dan langsung menuju pekerjaan yang berkaitan.
- Pengguna dapat menandai pemberitahuan sebagai sudah dibaca.
- Pengguna dapat memperbarui nomor telepon dan kata sandi akunnya.
- Pengguna yang memegang kewenangan tanda tangan dapat menyiapkan kredensial tanda tangan elektronik dari profil akunnya.

## TTE

Ketersediaan kredensial TTE dan kewenangan penandatanganan adalah dua hal
terpisah.

Pemegang kewenangan Dekan atau Ketua Jurusan/Kadep harus dapat menyiapkan
kredensial TTE meskipun akun tersebut masih memiliki legacy global role seperti
`PENYUSUN`.

Kewenangan penandatanganan aktual tetap ditentukan dari lingkup organisasi SOP.

Tidak ada hasil penolakan bisnis untuk TTE. Hasil yang diharapkan setelah SOP
diteruskan oleh Pemilik Proses adalah `BERLAKU`; kegagalan teknis membuat versi
tetap dapat dicoba kembali pada `MENUNGGU_TTE`.

## Pelaksana Catalog

`Pelaksana` is the canonical reusable global procedure/swimlane actor catalog, for example `Dosen`, `Mahasiswa`, or `Admin Akademik`.

Committed semantics:

- catalog identity is global to the FTI application;
- Pelaksana is not owned by an OPD, Fakultas, Jurusan, Proses Bisnis, Tim Proses, or SOP;
- hubungan Proses Bisnis menentukan siapa yang boleh menyusun SOP, bukan baris Pelaksana yang tersedia;
- an SOP version selects Pelaksana entries as swimlanes and preserves stable label history for that version;
- a procedure step may reference only an actor selected by that same SOP version;
- exact duplicate catalog identities may be consolidated only when identity is unambiguous;
- legacy `Pelaksana.opdId` is a compatibility shadow, not target ownership semantics.

## Platform Administration

`SUPER_ADMIN` dapat mengelola kebutuhan platform seperti:

- users/accounts;
- definisi Proses Bisnis dan metadata administrasinya;
- assignment Pemilik Proses/Penyusun SOP;
- assignment kewenangan organisasi;
- konfigurasi eksplisit lain yang diperlukan untuk menjalankan aplikasi.

`SUPER_ADMIN` tidak otomatis boleh:

- membuat atau mengedit SOP pada Proses Bisnis yang tidak terkait;
- melakukan review sebagai Pemilik Proses;
- melakukan TTE sebagai pejabat berwenang;
- mencabut SOP sebagai pejabat berwenang;
- memaksa SOP menjadi berlaku dengan melewati workflow.

## Notifications

Event workflow Proses Bisnis menggunakan resolusi penerima kontekstual dan
persistence notifikasi FTI-native.

Committed events currently include:

```text
Kirim SOP Proses Bisnis
  -> Pemilik Proses

Pemilik Proses meng-acc hasil review dan meneruskan
  -> Dekan / Ketua Jurusan sesuai lingkup Proses Bisnis

Pemilik Proses meminta perbaikan
  -> Penyusun SOP

Pejabat menyelesaikan TTE dan SOP menjadi BERLAKU
  -> Penyusun SOP
  -> Pemilik Proses

Pejabat berwenang mencabut SOP yang berlaku
  -> Penyusun SOP
  -> Pemilik Proses
```

Committed feedback semantics:

- feedback perbaikan dibuat dalam transaksi bisnis yang sama dengan transisi perbaikan oleh Pemilik Proses;
- feedback status berlaku hanya dibuat ketika finalisasi TTE berhasil membuat versi `BERLAKU`;
- revocation feedback is created in the same business transaction as `BERLAKU -> DICABUT` and official-artifact revocation;
- penerima notifikasi tidak digandakan ketika satu akun memiliki lebih dari satu hubungan yang relevan dengan event;
- penerima feedback berasal dari bukti Proses Bisnis dan authorship, bukan legacy global workflow roles;
- tindakan feedback target menggunakan workspace FTI-native yang ada, bukan route legacy-role baru;
- realtime refresh may be emitted after commit, but notification persistence must not be orphaned from the business transition that caused it.

The active notification bell reads only Process-native notification history and
the native Process reminder state. Legacy WhatsApp and in-app notification
state is retained only in archived database tables for historical retention.

## Public Archive & Discovery

The normal public archive for the target FTI product is Proses Bisnis-first.

Target discovery model:

```text
FACULTY / DEPARTMENT scope
  -> Proses Bisnis
       -> current published SOP
            -> official published PDF
```

Committed semantics:

- `SOP.processId` is the native authoritative ownership/classification for SOP yang terikat pada Proses Bisnis in target public discovery; `ProcessSopBinding` remains only as migration/backfill evidence and explicit compatibility boundary;
- an SOP terikat pada Proses Bisnis is public only when the relevant version is `BERLAKU` and has an official `PUBLISHED` PDF artifact;
- Proses Bisnis Fakultas dan Proses Bisnis Jurusan dapat ditemukan dari lingkup organisasi yang tersimpan; konteks Jurusan ditampilkan untuk Proses Bisnis dengan lingkup `DEPARTMENT`;
- selecting a Proses Bisnis returns only the current published SOPs bound to that Proses Bisnis;
- global public search may match SOP title, SOP number, Proses Bisnis name, and Jurusan name;
- target global search must not duplicate an SOP terikat pada Proses Bisnis through its legacy `SOP.opdId` compatibility shadow;
- legacy/unbound published SOPs may remain discoverable through an explicit compatibility fallback while migration is incomplete;
- public preview/open actions reuse the existing official PDF endpoint and therefore inherit its current-state checks;
- contextual revocation removes an SOP terikat pada Proses Bisnis from current target discovery and official public PDF availability while preserving historical evidence;
- legacy OPD-based public endpoints remain compatibility APIs and are not silently repurposed as target Process APIs.

Additive target endpoints:

```text
GET /sop/public/fti/processes
GET /sop/public/fti/processes/:processId/sop
GET /sop/public/fti/sop
```

Navigasi normal `/arsip` harus menggunakan istilah Proses Bisnis dan lingkup FTI,
bukan mengharuskan pengunjung memahami ownership era OPD.

## Product Experience Direction

Authenticated target navigation/work surfaces should be derived from actual capability:

```text
Process relationship
Organizational authority
Platform administration
```

Pengguna yang bekerja pada Proses Bisnis tidak perlu memahami legacy global
workflow roles untuk menemukan pekerjaan SOP normal.

Legacy routes dapat tetap beroperasi untuk compatibility, tetapi vocabulary yang
dihadapi pengguna harus menggunakan istilah Proses Bisnis dan kewenangan FTI.

## Version / Publication / Verification Invariants

Unless explicitly changed, preserve:

- one current effective version behavior;
- controlled replacement/supersession of a previous effective version;
- contextual revocation semantics;
- audit/history evidence;
- TTE evidence;
- official artifact generation;
- public verification of signed/published evidence.

A revoked version is historical evidence, not a current effective/public SOP.

Do not fabricate historical author/reviewer/approver/signing evidence during migration.

## Legacy Compatibility

Legacy concepts such as:

```text
OPD
PENYUSUN
PJ_PENYUSUN
EVALUATOR
PJ_EVALUATOR
KEPALA_OPD
PengajuanEvaluasi
```

remain compatibility/implementation concepts while migration is incomplete.

Committed migration direction:

- semantics target menjadi primary untuk pekerjaan yang terikat pada Proses Bisnis;
- legacy/unbound behavior remains available only where a concrete compatibility or historical requirement still exists;
- historical data and legal/audit evidence are preserved;
- migration is additive/reversible where practical;
- compatibility adapters must remain explicit rather than leaking legacy ownership/authorization back into target-domain code;
- physical cleanup follows proven semantic cutover rather than preceding it.

Compatibility is temporary architecture, not an alternate long-term product model.

### Retired Unused Capabilities

The following capabilities are explicitly retired from the active product
because they are not used:

- per-detail `NilaiEvaluasi` scoring and `LogNilaiEvaluasi` history UI/API;
- legacy evaluation feedback, BA evaluation workflow, and evaluator-role
  submission surfaces;
- WhatsApp reminder delivery/state and legacy in-app notification state.

Their historical tables are archived by the forward migration
`20260906120000_retire_legacy_evaluation_and_whatsapp`, not dropped. The active
replacement for review, feedback, notification, reminder, approval, and TTE is
the Process-native workflow already defined above. `PengajuanEvaluasi` remains
only as a historical parent until a separate retention decision approves its
physical removal.

## Full FTI End State

**Full FTI** means active first-party product behavior no longer depends on OPD identity, OPD ownership, or legacy global workflow roles.

Target state:

```text
User
  -> Platform Role
  -> Hubungan Proses Bisnis / Kepemilikan
  -> Organizational Authority

Proses Bisnis
  -> organizational scope
  -> SOP
       -> review Proses Bisnis
       -> contextual TTE
       -> publication / revocation
```

Active FTI runtime must eventually satisfy all of these:

- kepemilikan SOP secara canonical langsung berasal dari `Process`; `SOP.opdId` dan `ProcessSopBinding` bukan dependency ownership/classification aktif;
- otorisasi akun/workflow tidak memerlukan `Pengguna.opdId` atau semantics legacy `PeranPengguna`;
- `OPD`, `RiwayatOpdPengguna`, `OPDPeraturan`, OPD-scoped Pelaksana compatibility fields, and similar legacy structures do not own target behavior;
- target TTE, notifikasi, public discovery, penyusunan, review, versioning, dan revocation hanya resolve dari semantics Proses Bisnis/kewenangan FTI;
- first-party client routes, DTOs, query keys, API clients, and navigation do not require OPD identifiers for normal target workflows;
- legacy OPD routes/APIs may survive temporarily only as explicit compatibility adapters with no first-party target dependency;
- legacy evaluation/global-role workflows are either migrated to a justified FTI-native capability or isolated as historical/compatibility behavior; they must not silently remain a second target workflow model.

Retirement targets include, when no longer required by concrete compatibility contracts:

```text
SOP.opdId
Pengguna.opdId
ProcessSopBinding
RiwayatOpdPengguna
OPDPeraturan
OPD-owned target behavior
legacy global workflow-role authorization
legacy OPD first-party routes / DTOs / API clients
legacy public OPD contracts after their compatibility window closes
```

Do not mechanically replace `opdId` with `departmentId`. Department membership/identity must only exist when the FTI product actually requires it; Process relationship and organizational authority remain separate capability dimensions.

## Full FTI Migration Strategy

Use a staged migration rather than a giant rename/rewrite:

```text
EXPAND
  -> add native FTI ownership/contracts without removing legacy compatibility

BACKFILL
  -> populate native FTI relationships from authoritative existing evidence

CUTOVER
  -> make first-party reads/writes/authorization use native FTI sources only

PROVE
  -> verify data completeness, workflow integrity, legal/audit evidence, and zero first-party legacy dependency

CONTRACT
  -> retire obsolete legacy columns/tables/enums/routes/adapters only after the cutover is proven
```

Rules:

- each step must preserve current valid historical evidence;
- migration history already applied to shared environments is not rewritten casually;
- do not maintain indefinite dual-write/dual-authority paths; compatibility must have a concrete reason and retirement condition;
- cut over ownership/authorization before destructive physical cleanup;
- a compatibility field may remain physically present after semantic cutover, but it must not remain a hidden source of truth;
- remove legacy structures only after no target first-party behavior depends on them and required historical/compatibility reads are covered.

## Full FTI Exit Criteria

The repository may claim **FULL_FTI / LEGACY_RETIRED** only when all are true:

1. every active target SOP is canonically owned/classified by native FTI Process data without OPD fallback;
2. all target authorization decisions derive from Platform Role, Process Relationship, and Organizational Authority only;
3. first-party target UI/API paths contain no required OPD routing or ownership context;
4. target TTE, notification, publication, revocation, version, and public-discovery flows operate without OPD/global-role fallback;
5. migration/backfill completeness has been verified against persisted data;
6. historical audit/TTE/version/publication evidence remains intact;
7. any surviving OPD code/data is isolated to explicitly documented historical or external compatibility adapters;
8. obsolete legacy structures/contracts have either been removed or have a named external retention requirement and no active target dependency.

A repository-wide `OPD`/legacy-role search may still find immutable migration history, historical evidence names, or explicit compatibility adapters. It must not find those concepts acting as the source of truth for normal FTI product behavior.

## Current Product Non-Goals

Do not introduce without an explicit new product decision:

- multi-faculty or generic organization SaaS tenancy;
- a centralized evaluator organization/role for target Process review;
- an additional TTE scope for unit heads;
- generic configurable review/TTE or revocation-chain engines;
- `SUPER_ADMIN` workflow bypass;
- destructive historical OPD-to-FTI remapping;
- arbitrary per-SOP final signer configuration when authority is derivable from scope;
- a second parallel public archive taxonomy independent of Process ownership;
- bulk/scheduled revocation or a second revocation-approval workflow.

## Deferred / Transitional Work

The following remain implementation work until an explicit milestone activates them; their existence does not authorize autonomous cleanup:

- contract cleanup/retirement of `ProcessSopBinding` / `SOP.opdId` after compatibility evidence and external contracts permit it;
- continued isolation of `Pengguna.opdId` and legacy global roles from native target authorization;
- retirement or FTI-native replacement of remaining OPD-owned supporting-domain behavior;
- isolation/retirement of legacy evaluation workflows that are not part of the target FTI product;
- removal of legacy first-party routes, DTOs, API clients, tables, columns, enums, and compatibility APIs after exit criteria are met;
- physical normalization of persisted historical names only when it has concrete value and preserves evidence.

## Open Product Questions

Treat these as unresolved unless the user establishes them explicitly:

- whether any external consumer requires a long-lived OPD compatibility API after first-party Full FTI cutover;
- whether exceptional administrative repair operations need a dedicated audited product surface.

Do not resolve these questions through implementation inference.
