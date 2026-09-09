# PROJECT

## Product

SOPFlow FTI manages the complete SOP cycle for Fakultas Teknologi Informasi: assignment, authoring, pemeriksaan oleh Penanggung Jawab Proses Bisnis, pengesahan oleh pejabat berwenang, tanda tangan elektronik, publication, public verification, version replacement, and revocation.

## Canonical actors and responsibilities

| Aktor | Tanggung jawab |
| --- | --- |
| **Administrator Sistem** | Mengelola akun, Departemen, kelayakan/kewenangan Penanggung Jawab Proses Bisnis, dan penugasan Pejabat Berwenang. Administrator Sistem bukan otoritas workflow SOP. |
| **Penyusun SOP / Anggota Proses Bisnis** | Membuat dan mengedit SOP pada Proses Bisnis tempat pengguna menjadi anggota. Hanya Anggota Proses Bisnis yang mempunyai authoring authority. |
| **Penanggung Jawab Proses Bisnis (PJ Penyusun / Process Owner)** | Menentukan Proses Bisnis dan tim penyusun, mengelola/menugaskan Penyusun SOP, memeriksa hasil penyusunan, meminta revisi, dan menyatakan SOP siap diajukan ke pejabat berwenang. Penanggung Jawab tidak memperoleh hak edit SOP hanya karena menjadi owner. |
| **Pejabat Berwenang** | Melakukan pengesahan akhir dan TTE. Untuk lingkup Fakultas pemegang kewenangan adalah Dekan; untuk lingkup Departemen pemegang kewenangan adalah Kepala Departemen terkait. Pejabat Berwenang tidak mengedit isi SOP. |

## Global catalogs

- **Peraturan** dan **Pelaksana** adalah katalog global FTI dan tidak dimiliki oleh Departemen, Proses Bisnis, atau pengguna tertentu.
- Katalog global dapat dibuat, diubah, dan dihapus oleh pengguna yang aktif sebagai **Penanggung Jawab Proses Bisnis** atau **Anggota Proses Bisnis**.
- Referensi katalog di dalam sebuah SOP tidak mengubah ownership katalog tersebut.

## Core journey

```text
Administrator menyiapkan akun/struktur/kewenangan
 -> Penanggung Jawab membentuk Proses Bisnis dan menentukan Penyusun
 -> Penyusun membuat/edit SOP
 -> Penyusun mengirim SOP untuk pemeriksaan
 -> Penanggung Jawab memeriksa
      -> minta revisi -> kembali ke Penyusun
      -> siap diajukan -> Pejabat Berwenang
 -> Pejabat Berwenang mengesahkan
 -> TTE
 -> Berlaku / arsip publik
 -> optional versi baru atau pencabutan
```

## Product invariants

- Active SOP ownership is direct to `ProsesBisnis`.
- `PlatformRole` hanya mengatur administrasi sistem; tidak memberi hak workflow SOP.
- **Authoring authority hanya berasal dari `AnggotaProsesBisnis`.** Menjadi Penanggung Jawab Proses Bisnis tidak otomatis memberi hak membuat atau mengedit SOP.
- **Review authority hanya berasal dari `ProsesBisnis.penanggungJawabId`.**
- **Final approval dan TTE authority hanya berasal dari `PejabatBerwenang`** yang di-resolve dari lingkup Proses Bisnis.
- Faculty Proses Bisnis resolves to Dekan; Departemen Proses Bisnis resolves to Kepala Departemen terkait.
- Signing evidence stores contextual pejabat berwenang.
- Peraturan and Pelaksana are reusable global catalogs managed by active Penanggung Jawab/Anggota Proses Bisnis.
- Public archive and public signing verification expose current FTI semantics.
- Historical migration SQL is immutable implementation history and is not a product contract.

## Product language

Gunakan nomenklatur birokrasi pendidikan pada UI dan dokumentasi produk:

- `Administrator Sistem`, bukan `Platform Admin` pada UI.
- `Pengguna`, bukan generic `User` pada UI.
- `Penanggung Jawab Proses Bisnis`, bukan `Owner` kecuali nama internal/teknis yang memang sudah menjadi identifier.
- `Penyusun SOP` atau `Anggota Proses Bisnis`, bukan `Member` pada UI.
- `Pejabat Berwenang`, `Dekan`, `Kepala Departemen`.
- `Pemeriksaan`, `Minta Revisi`, `Siap Diajukan`, `Pengesahan`, `Tanda Tangan Elektronik` untuk tindakan user-facing.

Internal enum/API identifiers may stay in English when changing them would add migration/compatibility risk; presentation labels must use the canonical product language above.

## Frontend interaction rules

- Operational CRUD is **table-first**.
- Create/edit actions open a dialog; destructive actions use confirmation dialogs.
- Do not use cards whose only purpose is navigation/redirect.
- Do not create duplicate dashboard launchers when sidebar/navigation already exposes the same destination.
- Route access follows the same capability boundary as the backend: admin, authoring member, process owner, or pejabat berwenang.

## Protected boundary

The existing SOP edit workspace is protected. Do not redesign, restyle, move, or rewrite its observable authoring UI/UX as part of administration, routing, terminology, or CRUD cleanup. See `.agents/PROTECTED_SURFACES.md`.

## Engineering boundary

Preserve SOP editor/procedure/diagram behavior unless a requested user outcome explicitly requires changing that workspace. Prefer the smallest coherent vertical change and proportional verification.