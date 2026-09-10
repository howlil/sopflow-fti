# SOPFlow

SOPFlow adalah aplikasi berbasis web untuk mendukung pengelolaan dokumen Standar Operasional Prosedur (SOP). Stack utama terdiri dari frontend React/Vite, backend NestJS TypeScript, Prisma, MariaDB, dan Docker Compose.

## Arsitektur runtime ringkas

```text
Public HTTP/HTTPS
      |
Reverse proxy / platform ingress
      |
Frontend Nginx + SSR :8080
      |
Backend NestJS :3001
      |
MariaDB :3306

Deployment startup:
MariaDB -> bootstrap one-shot -> Backend -> Frontend

Backend -> persistent PDF volume /app/storage/sop-pdf
```

Port `8080`, `3001`, dan `3306` adalah port internal service/container. Pada deployment normal hanya frontend yang menjadi target public ingress.

Dokumentasi arsitektur lebih lengkap: `.agents/ARCHITECTURE.md` dan `docs/arsitektur-sistem.md`.

## Local development

Development startup tidak menjalankan migration atau generate Prisma otomatis, sehingga restart Nest tetap cepat. Jalankan persiapan database hanya saat pertama kali setup atau setelah schema/migration berubah:

```sh
cd server
pnpm db:prepare
pnpm start:dev
```

Untuk restart development biasa, cukup jalankan `pnpm start:dev`. CI menjalankan Prisma generate dan migration smoke secara eksplisit. Production menjalankan migration melalui service `bootstrap` satu kali sebelum backend dibuat; backend application startup sendiri hanya menjalankan `node dist/src/main.js`.

## Local Docker Compose

1. Salin template environment:

   ```sh
   cp .env.example .env
   ```

2. Isi lima nilai deployment pada `.env`.

3. Validasi dan jalankan stack:

   ```sh
   docker compose --env-file .env config
   docker compose --env-file .env build
   docker compose --env-file .env up -d
   ```

4. Periksa service/log:

   ```sh
   docker compose --env-file .env ps -a
   docker compose --env-file .env logs -f bootstrap backend frontend
   ```

5. Hentikan stack:

   ```sh
   docker compose --env-file .env down
   ```

## Environment production

`compose.yml` sengaja mempunyai external environment surface yang kecil. Nilai yang wajib disediakan hanya:

```dotenv
DATABASE_PASSWORD=change-me-database-password
JWT_SECRET=change-me-jwt-secret-at-least-32-characters
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-32-characters
TTE_ENCRYPTION_SECRET=change-me-dedicated-tte-secret-at-least-32-characters
PUBLIC_APP_ORIGIN=https://sopflow.example.com
```

Aturan konfigurasi:

- gunakan nama kanonis aplikasi `DATABASE_PASSWORD`; jangan membuat alias deployment seperti `DB_PASSWORD`;
- `TTE_ENCRYPTION_SECRET` harus berbeda dari kedua JWT secret;
- database host, port, user, dan nama database memakai topology/default Compose yang stabil dan tidak perlu diduplikasi ke project environment;
- `DATABASE_URL` tidak diperlukan pada Compose karena Prisma membentuk URL dari `DATABASE_*`;
- jangan menambahkan optional/tuning environment ke deployment hanya karena schema aplikasi mendukungnya. Tambahkan hanya bila ada kebutuhan runtime yang eksplisit.

`.env.example` adalah source of truth untuk external environment production yang diperlukan `compose.yml`. Jangan commit nilai secret sebenarnya.

## Notifikasi

Runtime saat ini menggunakan notifikasi in-app. Backend menyimpan histori notifikasi, unread state, action destination, dan stream Server-Sent Events. Tidak ada outbound WhatsApp atau webhook delivery eksternal.

## TTE dan PDF signing

SOPFlow menggunakan TTE internal untuk kebutuhan aplikasi/tugas akhir. Kredensial penandatangan berupa PKCS#12/P12 personal per pengguna, bukan satu P12 global server.

- PIN TTE disimpan dalam bentuk hash.
- P12 personal disimpan per pengguna.
- Passphrase P12 dienkripsi menggunakan PIN pengguna + `TTE_ENCRYPTION_SECRET`.
- Ciphertext aktif menggunakan format versioned `v2`.
- PDF hasil signing disimpan pada persistent Docker volume `sop_pdf_data` dengan default path `/app/storage/sop-pdf`.

Aggressive legacy cleanup menghapus dekripsi ciphertext P12 format lama tanpa prefix `v2:`. Environment yang memiliki credential lama harus meminta pengguna melakukan setup/upload TTE ulang setelah upgrade.

Detail:

- `docs/detail_workflow_dan_teknis_tte.md`
- `docs/tanda_tangan_elektronik_dan_ca.md`

## Deployment pada MyPaaS

Gunakan Docker Compose deployment.

- Main service: `frontend`
- Target/internal frontend port: `8080`
- Public HTTP/HTTPS tetap ditangani oleh ingress/reverse proxy platform.
- Backend `3001` dan MariaDB `3306` tidak perlu menjadi public application port.
- Set hanya lima environment dari `.env.example` melalui project settings MyPaaS.

Urutan startup production:

```text
MariaDB healthy
  -> bootstrap (one-shot)
       -> verify/adopt existing FTI baseline when safe
       -> prisma migrate deploy
       -> seed only if database is empty
  -> backend application
       -> /api/health/ready
  -> frontend nginx + SSR
       -> /healthz
  -> public ready
```

`bootstrap` adalah satu-satunya owner migration/seed. Jika migration gagal, deployment berhenti pada bootstrap dengan error sebenarnya; backend tidak crash-loop menjalankan migration berulang kali.

Health ownership juga dipisahkan:

- DB health hanya MariaDB;
- bootstrap success = process exit `0`;
- backend readiness = database connectivity + writable SOP storage;
- frontend `/healthz` = nginx + SSR, tidak mem-proxy backend readiness.

Backend production runtime tidak bergantung pada pnpm/Corepack atau npm registry setelah image selesai dibangun. Frontend dan backend Dockerfile memakai `pnpm@11.21.0`, sama dengan `package.json`, dan masing-masing memakai satu dependency-install path sebelum production pruning.

Database production mempertahankan physical schema name `sop_biro_organisasi` karena persistent volume lama dibuat dengan nama tersebut. Ini hanya nama schema fisik; domain aplikasi tetap FTI.

## Seed data

Seed default hanya memuat master/demo identity data yang diperlukan untuk database kosong. Pada database populated, seed entrypoint mengambil fast path dan tidak melakukan boot Nest kedua.

Jangan menjalankan seed manual terhadap database production tanpa memahami data yang akan direkonsiliasi.

## Testing dan CI

Backend:

```sh
cd server
pnpm test
```

Frontend:

```sh
cd client
pnpm test
```

CI utama:

- `Server CI`: Prisma validate/generate, production Nest build, typecheck, Jest unit suite;
- `Client CI`: production build/route consistency, typecheck, Vitest suite;
- `Migration Smoke`: hanya ketika Prisma/migration berubah atau dipanggil manual; menjalankan migration chain pada MariaDB;
- `Deployment Smoke`: satu-satunya owner boundary Docker/Compose. Ia build image lalu menjalankan production Compose sampai `db -> bootstrap -> backend -> frontend` benar-benar sehat dan menampilkan log tiap service bila gagal;
- `Full FTI Exit`: manual-only untuk qualification cutover yang luas.

Browser E2E manual dan dipilih berdasarkan business use case di `client/e2e/use-cases.json`, misalnya:

```sh
cd client
pnpm test:e2e:usecase -- UC01
```

Jangan menjadikan browser E2E atau broad qualification sebagai gate permanen setiap perubahan. Gunakan changed-risk boundary di `.agents/QUALITY.md`.

Dokumentasi unit/integration yang masih relevan:

- `docs/unit-test.md`
- `docs/integration-test.md`

Jumlah test dan coverage yang tercatat pada dokumen penelitian adalah historical snapshot. Status commit terkini ditentukan oleh automated test/CI yang relevan pada commit tersebut.

## Catatan production TTE

CA dan P12 internal SOPFlow bukan pengganti PSrE/BSrE. Jika sistem dikembangkan menjadi deployment pemerintahan production dengan kebutuhan sertifikat elektronik resmi, boundary signing sebaiknya diintegrasikan ke PSrE yang sesuai kebijakan instansi sehingga aplikasi tidak menjadi pemegang private key penandatangan.
