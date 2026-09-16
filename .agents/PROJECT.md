# SOPFlow — Use Case dan Constraint Aktor

## Tujuan Produk

SOPFlow mengelola siklus Standar Operasional Prosedur (SOP) yang melekat pada
satu Proses Bisnis, mulai dari draf, penyusunan, pemeriksaan oleh Penanggung
Jawab Proses Bisnis, Tanda Tangan Elektronik (TTE) oleh Pejabat Penandatangan,
sampai SOP ditetapkan berlaku dan dapat dibaca publik.

Dokumen ini adalah kontrak produk untuk menentukan siapa yang boleh melakukan
apa, pada konteks Proses Bisnis dan lingkup organisasi yang mana.

## Model akses yang wajib

- `platformRole` hanya membedakan `SUPER_ADMIN` dan `USER`; role tersebut tidak
  otomatis memberi akses ke seluruh Proses Bisnis.
- Akses workflow selalu dihitung dari relasi akun terhadap Proses Bisnis atau
  assignment pejabat pada lingkup organisasinya.
- Setiap SOP harus memiliki tepat satu Proses Bisnis.
- Setiap Proses Bisnis memiliki tepat satu Penanggung Jawab Proses Bisnis.
- Lingkup SOP mengikuti konteks Proses Bisnis: `FACULTY` atau `DEPARTMENT`.
- Tidak ada aksi workflow yang boleh melewati batas Fakultas, Departemen, atau
  Proses Bisnis yang sudah di-assign.
- Validasi backend adalah sumber kebenaran. Pembatasan di UI hanya membantu
  menemukan fitur dan bukan pengganti otorisasi backend.
- `SUPER_ADMIN` adalah aktor administrasi platform, bukan bypass global untuk
  workflow SOP.

## Lifecycle inti

```text
DRAFT / REVISION_REQUIRED
  -> anggota Proses Bisnis menyusun dan mengirim
PROCESS_REVIEW
  -> Penanggung Jawab Proses Bisnis menyetujui atau mengembalikan untuk perbaikan
REVISION_REQUIRED -> kembali ke authoring dan dikirim ulang
PROCESS_REVIEW --terima--> TTE_PENDING
TTE_PENDING
  -> Pejabat Penandatangan yang tepat melakukan TTE
EFFECTIVE
  -> SOP dapat dipublikasikan dan dibaca publik
EFFECTIVE
  -> dapat diganti dengan versi baru atau dicabut sesuai aturan lifecycle
```

SOP yang belum `EFFECTIVE` tidak boleh muncul sebagai dokumen publik. Bukti
pemeriksaan, komentar perbaikan, dan bukti TTE harus tetap tersimpan sebagai
bagian dari riwayat siklus.

Katalog `Peraturan` dan `Pelaksana` bersifat reusable/global. Keduanya bukan
membership Proses Bisnis dan tidak boleh dipakai sebagai jalan pintas untuk
memberi hak penyuntingan, pemeriksaan, pengesahan, atau TTE.

## Aktor, use case, dan constraint

### 1. Super Admin / Administrator Platform

**Use case**

- Mengelola akun aktif dan struktur organisasi FTI.
- Mengelola assignment Penanggung Jawab Proses Bisnis.
- Melihat katalog lintas Proses Bisnis: lingkup, Penanggung Jawab, Penyusun SOP,
  status keanggotaan, dan riwayat undangan.
- Mengundang ulang Penyusun SOP dengan menyalin ulang link undangan.
- Memindahkan anggota dari satu Proses Bisnis ke Proses Bisnis lain ketika
  diperlukan, dengan Penanggung Jawab dan lingkup tujuan yang jelas.
- Menetapkan tepat satu Dekan aktif untuk lingkup Fakultas.
- Menetapkan tepat satu Kepala Departemen aktif untuk setiap Departemen.
- Melakukan administrasi dan melihat status operasional lintas konteks untuk
  kebutuhan governance.

**Constraint**

- Tidak otomatis menjadi Penanggung Jawab, Penyusun, pemeriksa, atau penanda
  tangan hanya karena memiliki `SUPER_ADMIN`.
- Tidak boleh mengubah isi SOP, memberi keputusan pemeriksaan, atau melakukan TTE
  sebagai bypass workflow.
- Pemindahan anggota harus mengubah membership secara eksplisit dan tidak boleh
  mengubah pemilik Proses Bisnis secara diam-diam.
- Assignment pejabat harus aktif, unik berdasarkan authority key, dan tidak
  boleh menghasilkan dua pemegang aktif untuk satu entitas.
- Semua operasi administrasi lintas konteks harus tercatat dan tetap tunduk pada
  aturan integritas organisasi.

### 2. Penanggung Jawab Proses Bisnis

**Use case**

- Membuat dan mengelola Proses Bisnis yang memang menjadi tanggung jawabnya.
- Mengundang Penyusun SOP ke Proses Bisnisnya.
- Melihat daftar SOP dalam Proses Bisnis yang dimiliki.
- Membuka detail SOP untuk melakukan pemeriksaan pada panel komentar.
- Memberi catatan pemeriksaan dan mengembalikan SOP untuk perbaikan.
- Menyetujui hasil pemeriksaan sehingga siklus berpindah ke `TTE_PENDING`.
- Melihat status pemeriksaan, perbaikan, dan aliran menuju Pejabat Penandatangan.

**Constraint**

- Hanya dapat mengelola Proses Bisnis dan lingkup yang sudah di-assign.
- Hanya dapat memeriksa SOP milik Proses Bisnisnya; bukan SOP Proses Bisnis lain.
- Hanya dapat mengambil keputusan saat status SOP `PROCESS_REVIEW`.
- `Kembalikan untuk Perbaikan` wajib menyertakan komentar yang menjadi bukti pemeriksaan.
- Tidak boleh mengedit properti, isi, langkah, atau diagram SOP sebagai pengganti
  Penyusun SOP.
- Tidak dapat menginisiasi SOP hanya karena menjadi Penanggung Jawab; inisiasi dilakukan
  oleh anggota yang ditetapkan sebagai Penyusun SOP.
- Tidak otomatis boleh TTE. TTE hanya boleh dilakukan jika akun yang sama juga
  merupakan pemegang assignment Pejabat Penandatangan yang tepat.
- Proses Bisnis yang diarsipkan tidak menerima perubahan workflow.

### 3. Penyusun SOP / Anggota Proses Bisnis

**Use case**

- Melihat Proses Bisnis tempat akun tersebut terdaftar sebagai anggota.
- Membuat atau menginisiasi SOP di Proses Bisnis yang di-assign.
- Mengisi dan mengubah metadata, properti, isi, langkah, serta diagram SOP pada
  fase authoring.
- Menyimpan draf.
- Mengirim SOP lengkap ke pemeriksaan Penanggung Jawab Proses Bisnis.
- Membaca catatan pemeriksaan, memperbaiki SOP, lalu mengirim ulang.
- Melihat status lifecycle SOP yang sedang disusun.

**Constraint**

- Hanya dapat membuat dan mengubah SOP pada Proses Bisnis tempat akun menjadi
  anggota aktif.
- Tidak boleh membuat, melihat, atau mengubah SOP lintas Proses Bisnis tanpa
  membership pada konteks tersebut.
- Tidak dapat memberi keputusan pemeriksaan, pengesahan, atau melakukan TTE.
- SOP harus memenuhi kelengkapan minimum sebelum dapat dikirim untuk pemeriksaan.
- Setelah dikirim ke `PROCESS_REVIEW`, bagian authoring terkunci sampai diminta
  perbaikan atau siklus mengembalikan hak penyuntingan.
- Komentar pemeriksa adalah instruksi perbaikan; Penyusun SOP tidak boleh menghapus
  bukti keputusan pemeriksaan.

### 4. Pejabat Berwenang / Penanda Tangan TTE

Pejabat berwenang ditentukan oleh lingkup dan entitas organisasi SOP:

| Lingkup SOP | Authority key | Pemegang aktif | Batas tanda tangan |
| --- | --- | --- | --- |
| Fakultas | `DEAN` | tepat satu Dekan aktif | hanya SOP lingkup Fakultas tersebut |
| Departemen | `HEAD_OF_DEPARTMENT:<departemenId>` | tepat satu Kepala Departemen aktif per Departemen | hanya SOP Departemen tersebut |

**Use case**

- Melihat antrian siklus SOP dalam lingkup organisasi yang menjadi
  assignment-nya.
- Membuka preview SOP sebelum tanda tangan.
- Melakukan TTE satu SOP.
- Melakukan bulk TTE untuk beberapa SOP yang sama-sama valid dan berada dalam
  lingkup assignment-nya.
- Melihat tab SOP yang akan ditandatangani dan SOP yang sudah selesai
  ditandatangani.
- Melihat hasil dan bukti TTE.

**Constraint**

- Hanya pemegang assignment aktif yang cocok dengan authority key SOP yang
  boleh melakukan TTE.
- Dekan hanya dapat menandatangani SOP Fakultas yang menjadi lingkupnya.
- Kepala Departemen hanya dapat menandatangani SOP Departemennya sendiri.
- Tidak boleh menandatangani SOP Fakultas lain atau Departemen lain.
- Satu entitas organisasi tidak boleh memiliki lebih dari satu pemegang aktif
  untuk authority key yang sama.
- TTE hanya tersedia setelah Penanggung Jawab Proses Bisnis menyetujui hasil pemeriksaan dan
  statusnya `TTE_PENDING`.
- Pejabat tidak memperoleh hak penyuntingan atau hak pemeriksaan hanya karena menjadi
  penanda tangan.
- Bulk TTE harus memvalidasi ulang setiap SOP satu per satu; satu item yang
  tidak sesuai lingkup kewenangan atau status tidak boleh lolos karena item lain valid.

### 5. Publik / Pengguna tanpa assignment workflow

**Use case**

- Mencari dan membaca SOP yang sudah efektif.
- Melihat versi publik dan status publikasi yang diizinkan.

**Constraint**

- Hanya SOP berstatus `EFFECTIVE` yang boleh diakses sebagai dokumen publik.
- Tidak boleh melihat draf, komentar internal, hasil pemeriksaan, data TTE
  internal, atau SOP yang masih dalam proses.
- Tidak memiliki aksi penyuntingan, komentar, pemeriksaan, pengesahan, atau TTE.

## Matriks otorisasi singkat

| Aksi | Super Admin | Penanggung Jawab | Penyusun / Anggota | Pejabat TTE | Publik |
| --- | --- | --- | --- | --- | --- |
| Kelola akun/struktur | Ya | Tidak | Tidak | Tidak | Tidak |
| Kelola keanggotaan/undangan | Lintas konteks | Proses Bisnis sendiri | Tidak | Tidak | Tidak |
| Buat/edit isi SOP | Tidak sebagai bypass | Tidak | Ya, pada Proses Bisnis sendiri | Tidak | Tidak |
| Kirim SOP untuk pemeriksaan | Tidak sebagai bypass | Tidak | Ya, sebagai anggota | Tidak | Tidak |
| Komentar/pemeriksaan SOP | Tidak sebagai bypass | Ya, Proses Bisnis sendiri | Tidak | Tidak | Tidak |
| Setujui hasil pemeriksaan menuju TTE | Tidak sebagai bypass | Ya, Proses Bisnis sendiri | Tidak | Tidak | Tidak |
| TTE | Tidak sebagai bypass | Hanya jika juga pemegang authority | Tidak | Ya, authority + lingkup cocok | Tidak |
| Baca SOP publik | Administratif | Dalam konteksnya | Dalam konteksnya | Dalam assignment-nya | Hanya `EFFECTIVE` |

## Invariant implementasi

Setiap use case yang mengubah data harus dapat dijelaskan dengan tuple berikut:

```text
(actorId, targetProsesBisnisId, targetSopId, capability, expectedStatus, scope)
```

Sebelum mutasi, sistem wajib:

1. memastikan actor memiliki relasi atau assignment yang benar pada target;
2. memastikan target berada pada lingkup organisasi yang sama;
3. memastikan status lifecycle sesuai dengan aksi;
4. melakukan mutasi secara atomik;
5. menyimpan bukti yang diperlukan: membership, keputusan pemeriksaan, komentar,
   notifikasi workflow, atau bukti TTE.

Jika salah satu boundary gagal, operasi ditolak dan tidak boleh jatuh kembali ke
akses global berdasarkan `platformRole`.

## Batas perubahan produk

Perubahan workflow harus mempertahankan perilaku editor SOP, prosedur, dan
diagram yang sudah ada kecuali ada permintaan produk yang secara eksplisit
mengubahnya. Riwayat migration SQL adalah sejarah implementasi yang immutable,
bukan kontrak produk.




saya mauanya gini
1. penyusun membuat sop 

saya consider, gimana si lifecyclenya, apakah perprobis, atau per unit sop, 
jadi kayak sekali iterasi itu gimana bentuknya bulk kah atau per unit
