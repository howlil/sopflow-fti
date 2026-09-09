# SOPFlow FTI E2E

Browser E2E bersifat manual-only. GitHub Actions tidak menjalankan Playwright dan perubahan `client/e2e/**` bukan CI trigger.

E2E diturunkan dari use case produk di `.agents/PROJECT.md`. File spec adalah fragmen implementasi; source of truth pemilihan suite adalah `client/e2e/use-cases.json`.

## Actors
- Platform Admin
- ProsesBisnis Owner
- ProsesBisnis Member / Penyusun SOP
- Dean
- Head of Departemen
- Public user

## Business use cases
- **UC01** — Admin menyiapkan akun, Departemen, ProsesBisnis, Owner/Member, dan pejabat berwenang.
- **UC02** — Member menyusun/submit SOP; Owner melakukan Process Review dan feedback.
- **UC03** — SOP lingkup Fakultas mendapat final approval, TTE Dean, lalu menjadi EFFECTIVE/public.
- **UC04** — SOP lingkup Departemen mendapat final approval, TTE Kepala Departemen yang relevan, lalu menjadi EFFECTIVE/public.
- **UC05** — Publik menemukan dan memverifikasi SOP efektif.
- **UC06** — Versi baru menggantikan versi efektif tanpa merusak histori/current publication.
- **UC07** — Dean/Kepala Departemen mencabut SOP efektif hanya dalam authority scope yang benar.

Setiap executable spec harus dimiliki tepat satu use case. `pnpm test:e2e:audit` menolak orphan spec, duplicate ownership, support legacy, dan vocabulary workflow legacy yang executable.

## Running manually
Gunakan database disposable yang nama/URL-nya mengandung `test` atau `ci_e2e`.

```bash
pnpm test:e2e:audit
pnpm test:e2e:usecase -- UC02
pnpm test:e2e:usecase -- UC03 UC05
pnpm test:e2e:usecase:all
```

Runner mereset dan seed database disposable sebelum setiap spec agar satu fragmen E2E tidak bergantung pada side effect fragmen lain.

## Seed / identities
Server seed target membuat Departemen, ProsesBisnis, membership, pejabat berwenang, Peraturan, dan Pelaksana. Gunakan identity di `client/e2e/fixtures/users.ts`; jangan menambahkan global workflow-role fixture.
