# SOPFlow

SOPFlow adalah aplikasi berbasis web untuk mendukung pengelolaan dokumen Standar Operasional Prosedur (SOP). Stack utama terdiri dari frontend React/Vite, backend NestJS TypeScript, Prisma, MariaDB, dan Docker Compose.

## Arsitektur runtime ringkas

```text
Public HTTP/HTTPS
      |
Reverse proxy / platform ingress
      |
Frontend Nginx :8080
      |
Backend NestJS :3001
      |
MariaDB :3306

Backend -> persistent PDF volume /app/storage/sop-pdf
```

Port `8080`, `3001`, dan `3306` adalah port internal service/container. Pada deployment normal hanya frontend yang menjadi target public ingress.

Dokumentasi arsitektur lebih lengkap: `docs/arsitektur-sistem.md`.

## Local Docker Compose

1. Salin template environment:

   ```sh
   cp .env.example .env
   ```

2. Isi secret dan nilai deployment pada `.env`.

3. Validasi dan jalankan stack:

   ```sh
   docker compose --env-file .env config
   docker compose --env-file .env build
   docker compose --env-file .env up -d
   ```

4. Periksa service/log:

   ```sh
   docker compose --env-file .env ps
   docker compose --env-file .env logs -f frontend backend
   ```

5. Hentikan stack:

   ```sh
   docker compose --env-file .env down
   ```

## Environment production

Pada Compose saat ini nilai deployment yang wajib disediakan adalah:

```dotenv
DB_ROOT_PASSWORD=change-me-root-password
DB_NAME=sop_biro_organisasi
DB_USER=sop_app
DB_PASSWORD=change-me-db-password

JWT_SECRET=change-me-jwt-secret-at-least-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-32-chars
TTE_ENCRYPTION_SECRET=change-me-dedicated-tte-secret-at-least-32-chars

PUBLIC_APP_ORIGIN=https://sopflow.example.com
```

`TTE_ENCRYPTION_SECRET` harus berbeda dari kedua JWT secret. Jangan commit secret yang sudah terisi.

`ALLOWED_ORIGINS` dapat digunakan bila deployment mempunyai lebih dari satu origin yang memang diizinkan. Production tidak menerima wildcard origin untuk request authenticated berbasis credentials.

Nilai tuning/default lain tersedia pada `.env.example` dan `compose.yml`.

## Notifikasi

Sprint 1 hanya mengaktifkan notifikasi in-app. Backend membuat histori notifikasi yang dapat dibaca lewat endpoint `notifications`, ringkasan unread, dan stream Server-Sent Events. Tidak ada konfigurasi outbound WhatsApp atau webhook delivery eksternal pada runtime saat ini.

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

## Deployment pada MyPaas

Gunakan Docker Compose deployment.

- Main service: `frontend`
- Target/internal frontend port: `8080`
- Public HTTP/HTTPS tetap ditangani oleh ingress/reverse proxy platform.
- Tidak perlu menambahkan `cap_add` atau `NET_BIND_SERVICE` pada frontend.
- Backend `3001` dan MariaDB `3306` tidak perlu menjadi public application port.

Set environment melalui project settings MyPaas berdasarkan `.env.example`. Jangan menambahkan `PORT`/`APP_PORT` hanya untuk public routing; frontend image sudah mempunyai internal listener `8080`.

Backend menjalankan `pnpm prisma migrate deploy` sebelum `pnpm start:prod`. Compose saat ini tidak menjalankan seed otomatis pada setiap restart.

## Seed data

Seed default hanya memuat master/demo identity data yang diperlukan untuk development/testing dan tidak lagi mempunyai `SEED_INCLUDE_WORKFLOW_DUMMY` untuk membuat workflow SOP historis secara massal.

Jangan menjalankan seed terhadap database production tanpa memahami data yang akan direkonsiliasi.

## Testing

Backend unit test:

```sh
cd server
pnpm test
```

Frontend unit test:

```sh
cd client
pnpm test
```

Critical Playwright business journeys:

```sh
cd client
pnpm test:e2e:critical
```

Dokumentasi:

- `docs/unit-test.md`
- `docs/integration-test.md`
- `docs/e2e-business-journeys.md`
- `client/e2e/README.md`

Jumlah test dan coverage yang tercatat pada dokumen penelitian adalah historical snapshot. Status commit terkini ditentukan oleh hasil test/CI pada commit tersebut.

## Catatan production TTE

CA dan P12 internal SOPFlow bukan pengganti PSrE/BSrE. Jika sistem dikembangkan menjadi deployment pemerintahan production dengan kebutuhan sertifikat elektronik resmi, boundary signing sebaiknya diintegrasikan ke PSrE yang sesuai kebijakan instansi sehingga aplikasi tidak menjadi pemegang private key penandatangan.

