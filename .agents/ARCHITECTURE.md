# ARCHITECTURE

## Target architecture

```text
Pengguna + PlatformRole
        |
        +--> Administrator Sistem
        |      -> akun / Departemen / kewenangan PJ / Pejabat Berwenang
        |
        +--> KewenanganPenanggungJawabProsesBisnis
        |      -> Penanggung Jawab Proses Bisnis
        |      -> bentuk Proses Bisnis / kelola Penyusun / assign SOP / pemeriksaan
        |
        +--> AnggotaProsesBisnis
        |      -> Penyusun SOP
        |      -> buat & edit SOP
        |
        +--> PenugasanPejabatBerwenang
               -> DEAN (Fakultas)
               -> HEAD_OF_DEPARTMENT (Departemen)
               -> pengesahan + TTE

ProsesBisnis ----> SOP ----> DetailSOP
     |              |
     |              +--> PenugasanPenyusunSOP (coordination, bukan ACL)
     +--> AnggotaProsesBisnis
```

### Identity and authorization

`PlatformRole` hanya untuk administrasi sistem. Authorization workflow dipisahkan secara eksplisit:

- **authoring**: hanya `AnggotaProsesBisnis` / Penyusun SOP;
- **pemeriksaan**: hanya `ProsesBisnis.penanggungJawabId`;
- **pengesahan dan TTE**: hanya `PejabatBerwenang` yang di-resolve dari lingkup Proses Bisnis;
- **katalog global Peraturan/Pelaksana**: mutasi oleh pengguna yang aktif sebagai Penanggung Jawab atau Anggota Proses Bisnis.

Administrator Sistem tidak mempunyai bypass workflow.

### SOP ownership and assignment

SOP aktif dimiliki langsung oleh satu Proses Bisnis melalui `SOP.prosesBisnisId`. Proses Bisnis mempunyai satu Penanggung Jawab dan nol atau lebih Anggota/Penyusun.

`PenugasanPenyusunSOP` menentukan **Penyusun utama** untuk koordinasi pekerjaan. Penugasan bukan ACL: hak membuat/edit tetap berasal dari keanggotaan Proses Bisnis. Penanggung Jawab dapat mengganti Penyusun utama tanpa memperoleh hak mengedit isi SOP.

Departemen hanya metadata lingkup organisasi, bukan pemilik SOP.

### Workflow

```text
Penyusun: DRAFT
   -> kirim untuk pemeriksaan
PJ: PROCESS_REVIEW
   -> REVISION_REQUIRED -> kembali ke Penyusun
   -> FINAL_APPROVAL -> siap diajukan
Pejabat Berwenang: pengesahan
   -> TTE_PENDING
Pejabat Berwenang: TTE
   -> EFFECTIVE
   -> SUPERSEDED | REVOKED
```

Pemeriksaan, pengesahan, signing evidence, publication, version replacement, dan revocation harus melakukan transition atomically bila diperlukan.

### TTE

Signing evidence menyimpan `PejabatBerwenang` (`DEAN` atau `HEAD_OF_DEPARTMENT`) beserta identitas penandatangan dan metadata sertifikat. Public verification mengekspos kewenangan kontekstual tersebut.

### Catalogs

Peraturan dan Pelaksana adalah katalog global FTI. Tidak ada ownership Departemen, Proses Bisnis, maupun pengguna pada katalog. Penanggung Jawab dan Anggota Proses Bisnis aktif dapat mengelola katalog; Procedure/diagram engine hanya mereferensikan katalog tersebut.

### Frontend boundaries

- Route authorization mengikuti capability backend, bukan role dashboard generik.
- Operational CRUD memakai table sebagai primary surface dan dialog untuk create/edit.
- PJ melakukan pemeriksaan melalui dokumen read-only, bukan SOP edit workspace.
- Pejabat Berwenang melakukan pemeriksaan read-only, pengesahan, dan TTE.
- SOP edit workspace hanya untuk Penyusun/Anggota dan tetap protected dari redesign incidental.

### Deployment boundaries

Production Compose mempunyai satu owner untuk setiap tahap startup:

```text
MariaDB
  -> bootstrap (one-shot)
       -> verify/adopt existing baseline when safe
       -> prisma migrate deploy
       -> seed only when database is empty
  -> backend
       -> node dist/src/main.js
  -> frontend
       -> SSR + nginx
```

Rules:

- migration dan seed tidak boleh dijalankan di application startup backend;
- `bootstrap` harus selesai dengan exit code `0` sebelum backend dibuat;
- backend readiness hanya memeriksa dependency yang benar-benar dibutuhkan backend (`database` + writable SOP storage);
- frontend health `/healthz` hanya memeriksa nginx + SSR; backend readiness tidak diproxy menjadi frontend health;
- frontend baru menjadi dependency-ready setelah backend healthy;
- migration/bootstrap failure harus muncul sebagai failure bootstrap, bukan crash-loop backend/frontend;
- production container build harus menggunakan package-manager version yang sama dengan `package.json` dan satu dependency-install path per image build;
- Deployment Smoke harus menjalankan production Compose yang sama sampai seluruh chain healthy.

### Persistence history

Migration SQL yang sudah diterapkan tetap immutable agar database lama dapat dimigrasikan deterministically. Historical identifiers di migration merupakan mechanics persistence, bukan product language.
