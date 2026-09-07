from __future__ import annotations

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
CHANGED: list[str] = []
DELETED: list[str] = []


def path(rel: str) -> Path:
    return ROOT / rel


def save(rel: str, content: str) -> None:
    p = path(rel)
    p.parent.mkdir(parents=True, exist_ok=True)
    old = p.read_text(encoding="utf-8") if p.exists() else None
    if old != content:
        p.write_text(content, encoding="utf-8")
        CHANGED.append(rel)


def transform(rel: str, fn) -> None:
    p = path(rel)
    if not p.exists():
        return
    old = p.read_text(encoding="utf-8")
    new = fn(old)
    if new != old:
        p.write_text(new, encoding="utf-8")
        CHANGED.append(rel)


def replace(rel: str, replacements: dict[str, str]) -> None:
    def apply(text: str) -> str:
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    transform(rel, apply)


def delete(rel: str) -> None:
    p = path(rel)
    if p.exists():
        p.unlink()
        DELETED.append(rel)


def replace_in_tree(root_rel: str, replacements: dict[str, str], suffixes=(".ts", ".tsx")) -> None:
    base = path(root_rel)
    if not base.exists():
        return
    for p in base.rglob("*"):
        if not p.is_file() or p.suffix not in suffixes:
            continue
        rel = p.relative_to(ROOT).as_posix()
        old = p.read_text(encoding="utf-8")
        new = old
        for source, target in replacements.items():
            new = new.replace(source, target)
        if new != old:
            p.write_text(new, encoding="utf-8")
            CHANGED.append(rel)


# ---------------------------------------------------------------------------
# S1 — build recovery: StatusSOP / BagianSOP / seed / TTE
# ---------------------------------------------------------------------------
status_constant_replacements = {
    "StatusSOP.BERLAKU": "StatusSOP.EFFECTIVE",
    "StatusSOP.DIGANTIKAN": "StatusSOP.SUPERSEDED",
    "StatusSOP.DICABUT": "StatusSOP.REVOKED",
    "StatusSOP.SEDANG_DIEVALUASI": "StatusSOP.PROCESS_REVIEW",
    "StatusSOP.REVISI_DARI_EVALUATOR": "StatusSOP.REVISION_REQUIRED",
    "BagianSOP.EVALUASI": "BagianSOP.REVIEW",
}
replace_in_tree("server/src", status_constant_replacements)
replace_in_tree("server/test", status_constant_replacements)

# Tests where the old pre-TTE value represented two different native states.
replace(
    "server/src/modules/sop/process-authoring/process-final-approval.service.spec.ts",
    {"StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR": "StatusSOP.FINAL_APPROVAL"},
)
replace(
    "server/src/modules/sop/process-authoring/process-owner-review.service.spec.ts",
    {"StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR": "StatusSOP.FINAL_APPROVAL"},
)
replace(
    "server/src/modules/tte/penandatanganan/process-tte.repository.spec.ts",
    {"StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR": "StatusSOP.TTE_PENDING"},
)
replace(
    "server/src/modules/sop/process-authoring/process-sop-lifecycle.projection.spec.ts",
    {"StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR": "StatusSOP.TTE_PENDING"},
)

# FTI E2E strings are post-approval states.
replace_in_tree(
    "client/e2e",
    {
        "'SEDANG_DIEVALUASI'": "'PROCESS_REVIEW'",
        '"SEDANG_DIEVALUASI"': '"PROCESS_REVIEW"',
        "'REVISI_DARI_EVALUATOR'": "'REVISION_REQUIRED'",
        '"REVISI_DARI_EVALUATOR"': '"REVISION_REQUIRED"',
        "'MENUNGGU_TTD_PJ_EVALUATOR'": "'TTE_PENDING'",
        '"MENUNGGU_TTD_PJ_EVALUATOR"': '"TTE_PENDING"',
        "'BERLAKU'": "'EFFECTIVE'",
        '"BERLAKU"': '"EFFECTIVE"',
        "'DIGANTIKAN'": "'SUPERSEDED'",
        '"DIGANTIKAN"': '"SUPERSEDED"',
        "'DICABUT'": "'REVOKED'",
        '"DICABUT"': '"REVOKED"',
    },
)

# Seed must match the contracted Pengguna schema.
def clean_seed(text: str) -> str:
    text = re.sub(r"^\s*opdId: null,\n", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*peran: null,\n", "", text, flags=re.MULTILINE)
    return text
transform("server/src/database/seed/seed.service.ts", clean_seed)

# Workbench activity DTO follows the native BagianSOP enum.
replace(
    "server/src/modules/sop/catalog/dto/penyusun-workbench-log-edit.dto.ts",
    {
        "'HEADER', 'LANGKAH', 'STATUS', 'UMPAN_BALIK', 'EVALUASI'": "'HEADER', 'LANGKAH', 'STATUS', 'UMPAN_BALIK', 'REVIEW'",
        "'HEADER' | 'LANGKAH' | 'STATUS' | 'UMPAN_BALIK' | 'EVALUASI'": "'HEADER' | 'LANGKAH' | 'STATUS' | 'UMPAN_BALIK' | 'REVIEW'",
        "Peran pengguna saat mencatat log": "Konteks aktor saat mencatat log",
    },
)

# TTE persistence now stores OrganizationalAuthority, not PeranPengguna.
replace(
    "server/src/modules/tte/shared/repository/tte.repository.ts",
    {
        "import { JenisDokumenTte, PeranPengguna } from '../../../../generated/prisma';": "import { JenisDokumenTte, OrganizationalAuthority } from '../../../../generated/prisma';",
        "readonly peran: PeranPengguna;": "readonly authority: OrganizationalAuthority;",
        "peran: true,": "authority: true,",
    },
)

replace(
    "server/src/modules/tte/penandatanganan/tte-pdf-signing.service.ts",
    {
        "readonly peran?: string;": "readonly authority?: string;",
        "peran: String(row.peran),": "authority: String(row.authority),",
    },
)

save(
    "server/src/modules/tte/verifikasi/tte-verifikasi.service.ts",
    """import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { OrganizationalAuthority } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import type { TtePengesahanPublicResponse } from '../shared/types/tte.types';
import { buildTteQrPayload } from '../shared/utils/tte-verifikasi-qr.util';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import { ProcessTteVerificationRepository } from './process-tte-verification.repository';

@Injectable()
export class TteVerifikasiService {
  constructor(
    private readonly tteRepository: TteRepository,
    private readonly publicUrlResolver: TtePublicUrlResolver,
    private readonly processVerificationRepository: ProcessTteVerificationRepository,
  ) {}

  async getPengesahanPublic(
    dokumenTteId: string,
    userId: string,
    req?: Pick<Request, 'headers'>,
  ): Promise<TtePengesahanPublicResponse> {
    const row = await this.tteRepository.findRiwayatPengesahanByUserAndDokumen(
      userId,
      dokumenTteId,
    );
    if (row === null || row.dokumenTte === null || row.user === null) {
      throw new NotFoundException('Data pengesahan tidak ditemukan');
    }

    const { detailSopId, processId } = row.dokumenTte;
    if (detailSopId === null || processId === null) {
      throw new NotFoundException('Dokumen TTE bukan artefak SOP FTI yang aktif');
    }

    const approval = await this.processVerificationRepository.findApprovalForSignedDetail(
      detailSopId,
      row.userId,
      processId,
    );
    if (approval === null || approval.authority !== row.authority) {
      throw new NotFoundException('Evidence authority pengesahan tidak valid');
    }

    const authorityLabel =
      row.authority === OrganizationalAuthority.DEAN ? ('Dekan' as const) : ('Kepala Departemen' as const);
    const qr = buildTteQrPayload({
      publicVerifyBaseUrl: this.publicUrlResolver.resolveDocumentVerifyBaseUrl(req),
      dokumenTteId: row.dokumenTte.dokumenTteId,
      hashDokumen: row.dokumenTte.hashDokumen,
    });

    return {
      userId: row.userId,
      dokumenTteId: row.dokumenTteId,
      ditandatanganiPada: row.ditandatanganiPada.toISOString(),
      authority: row.authority,
      authorityLabel,
      penandatangan: {
        nama: row.user.nama,
        nip: row.user.nip,
        jabatan: row.user.jabatan ?? '',
      },
      dokumen: {
        dokumenTteId: row.dokumenTte.dokumenTteId,
        nomorDokumen: row.dokumenTte.nomorDokumen,
        judulDokumen: row.dokumenTte.judulDokumen,
        jenisDokumen: String(row.dokumenTte.jenisDokumen),
        hashDokumen: row.dokumenTte.hashDokumen,
        sopDetailId: detailSopId,
      },
      qrVerificationUrl: qr.qrVerificationUrl,
      qrPayload: qr.qrPayload,
    };
  }
}
""",
)

save(
    "server/src/modules/tte/shared/dto/tte-pengesahan-public-response.dto.ts",
    """import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TtePengesahanPublicPenandatanganDto {
  @ApiProperty({ description: 'Nama penandatangan' })
  nama!: string;

  @ApiProperty({ description: 'NIP penandatangan' })
  nip!: string;

  @ApiProperty({ description: 'Jabatan (boleh kosong)' })
  jabatan!: string;
}

class TtePengesahanPublicDokumenDto {
  @ApiProperty()
  dokumenTteId!: string;

  @ApiProperty()
  nomorDokumen!: string;

  @ApiProperty()
  judulDokumen!: string;

  @ApiProperty({ description: 'Nilai enum JenisDokumenTte' })
  jenisDokumen!: string;

  @ApiProperty({ description: 'Hash SHA-256 kanonik dokumen' })
  hashDokumen!: string;

  @ApiProperty({ format: 'uuid' })
  sopDetailId!: string;
}

/** Respons publik untuk verifikasi QR pengesahan SOP FTI. */
export class TtePengesahanPublicResponseDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  dokumenTteId!: string;

  @ApiProperty({ description: 'Waktu pengesahan (ISO 8601)' })
  ditandatanganiPada!: string;

  @ApiProperty({
    enum: ['DEAN', 'HEAD_OF_DEPARTMENT'],
    description: 'Kewenangan organisasi yang menandatangani SOP.',
  })
  authority!: 'DEAN' | 'HEAD_OF_DEPARTMENT';

  @ApiProperty({
    enum: ['Dekan', 'Kepala Departemen'],
    description: 'Label kewenangan penandatangan.',
  })
  authorityLabel!: 'Dekan' | 'Kepala Departemen';

  @ApiProperty({ type: TtePengesahanPublicPenandatanganDto })
  penandatangan!: TtePengesahanPublicPenandatanganDto;

  @ApiProperty({ type: TtePengesahanPublicDokumenDto })
  dokumen!: TtePengesahanPublicDokumenDto;

  @ApiPropertyOptional({ nullable: true })
  qrVerificationUrl!: string | null;

  @ApiProperty({ description: 'String yang di-encode ke QR' })
  qrPayload!: string;
}
""",
)

# Native Process is the only storage namespace.
replace(
    "server/src/modules/sop/pdf/sop-pdf-storage.service.ts",
    {
        "    /** Native Process namespace. */\n    processId?: string;\n    /** Legacy compatibility namespace used only by the old evaluator workflow. */\n    opdId?: string;": "    processId: string;",
        "this.segment(params.processId ?? params.opdId ?? 'unscoped')": "this.segment(params.processId)",
    },
)

# ---------------------------------------------------------------------------
# S2 — post-contraction DB proof and CI workflows
# ---------------------------------------------------------------------------
delete("server/prisma/fti-legacy-retention-backfill.ts")
delete("server/prisma/identity-shadow-audit.ts")
delete("server/prisma/rehearse-process-sop-binding-retirement.ts")

save(
    "server/prisma/fti-baseline-audit.ts",
    """import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI schema audit`);
  return value;
};

const port = Number(process.env.DATABASE_PORT ?? '3306');
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required('DATABASE_HOST'),
    port,
    user: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: required('DATABASE_NAME'),
    connectionLimit: 2,
    connectTimeout: 15_000,
    allowPublicKeyRetrieval: true,
  }),
});

async function scalar(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ value: bigint | number | string }>>(sql);
  return Number(rows[0]?.value ?? 0);
}

async function run(): Promise<void> {
  const removedTables = [
    'OPD',
    'RiwayatOpdPengguna',
    'OPDPeraturan',
    'PengajuanEvaluasi',
    'NilaiEvaluasi',
    'PengingatWhatsApp',
    'LegacySopRetention',
    '_retired_ProcessSopBinding_20260906',
  ];
  const removedColumns: Array<[string, string]> = [
    ['Pengguna', 'opdId'],
    ['Pengguna', 'peran'],
    ['SOP', 'opdId'],
    ['Pelaksana', 'opdId'],
    ['DokumenTte', 'pengajuanEvaluasiId'],
    ['RiwayatTandaTangan', 'peran'],
  ];

  const tableResidue = await scalar(
    `SELECT COUNT(*) AS value FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${removedTables.map((name) => `'${name}'`).join(',')})`,
  );
  let columnResidue = 0;
  for (const [tableName, columnName] of removedColumns) {
    columnResidue += await scalar(
      `SELECT COUNT(*) AS value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`,
    );
  }

  const invalidStatusRows = await scalar(
    "SELECT COUNT(*) AS value FROM `DetailSOP` WHERE `status` NOT IN ('DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL','TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED')",
  );
  const statusColumnWithLegacyValues = await scalar(
    "SELECT COUNT(*) AS value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DetailSOP' AND COLUMN_NAME = 'status' AND (COLUMN_TYPE LIKE '%SEDANG_DIEVALUASI%' OR COLUMN_TYPE LIKE '%REVISI_DARI_EVALUATOR%' OR COLUMN_TYPE LIKE '%MENUNGGU_TTD_PJ_EVALUATOR%' OR COLUMN_TYPE LIKE '%BERLAKU%' OR COLUMN_TYPE LIKE '%DICABUT%')",
  );
  const orphanedProcessSop = await scalar(
    'SELECT COUNT(*) AS value FROM `SOP` s LEFT JOIN `Process` p ON p.processId = s.processId WHERE s.processId IS NOT NULL AND p.processId IS NULL',
  );
  const invalidSigningAuthority = await scalar(
    "SELECT COUNT(*) AS value FROM `RiwayatTandaTangan` WHERE `authority` NOT IN ('DEAN','HEAD_OF_DEPARTMENT')",
  );

  const result = {
    tableResidue,
    columnResidue,
    invalidStatusRows,
    statusColumnWithLegacyValues,
    orphanedProcessSop,
    invalidSigningAuthority,
  };
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result).some((value) => value !== 0)) {
    throw new Error('FTI post-contraction database invariant gagal');
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
""",
)

save(
    "server/scripts/full-fti-runtime-audit.cjs",
    """const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const scanRoots = [
  'server/src',
  'server/test',
  'client/src',
  'client/e2e',
];
const forbidden = [
  /\\bPeranPengguna\\b/,
  /\\bKEPALA_OPD\\b/,
  /\\bPJ_EVALUATOR\\b/,
  /\\bPJ_PENYUSUN\\b/,
  /\\bPengajuanEvaluasi\\b/,
  /\\bLegacySopRetention\\b/,
  /\\bopdId\\b/,
  /StatusSOP\\.(?:BERLAKU|DIGANTIKAN|DICABUT|SEDANG_DIEVALUASI|REVISI_DARI_EVALUATOR|MENUNGGU_TTD_PJ_EVALUATOR)/,
];
const extensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']);
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(repoRoot, absolute).replaceAll('\\\\', '/');
    const content = fs.readFileSync(absolute, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(content)) violations.push(`${relative}: ${pattern}`);
      pattern.lastIndex = 0;
    }
  }
}

for (const root of scanRoots) walk(path.join(repoRoot, root));

const schema = fs.readFileSync(path.join(repoRoot, 'server/prisma/schema.prisma'), 'utf8');
for (const pattern of [/model OPD\\b/, /\\bopdId\\s+String/, /enum PeranPengguna\\b/, /model PengajuanEvaluasi\\b/, /\\bperan\\s+PeranPengguna/]) {
  if (pattern.test(schema)) violations.push(`server/prisma/schema.prisma: ${pattern}`);
}

if (violations.length > 0) {
  console.error('FTI-only source audit failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('FTI-only source audit passed. Legacy vocabulary exists only in immutable migration history.');
""",
)

# package scripts: legacy-retention command is no longer part of target database operations.
def clean_package(text: str) -> str:
    data = json.loads(text)
    data["scripts"].pop("db:backfill:legacy-retention", None)
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"
transform("server/package.json", clean_package)

save(
    ".github/workflows/migration-smoke.yml",
    """name: Migration Smoke

on:
  push:
    paths:
      - 'server/prisma/**'
      - 'server/src/database/seed/**'
      - 'server/prisma.config.ts'
      - 'server/package.json'
      - '.github/workflows/migration-smoke.yml'
  pull_request:
    paths:
      - 'server/prisma/**'
      - 'server/src/database/seed/**'
      - 'server/prisma.config.ts'
      - 'server/package.json'
      - '.github/workflows/migration-smoke.yml'

permissions:
  contents: read

concurrency:
  group: migration-smoke-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify-migrations:
    runs-on: ubuntu-latest
    timeout-minutes: 12
    defaults:
      run:
        working-directory: server
    env:
      DATABASE_HOST: 127.0.0.1
      DATABASE_PORT: 3307
      DATABASE_USER: sop_test
      DATABASE_PASSWORD: sop_test_password
      DATABASE_NAME: sop_fti_test
      DATABASE_URL: mysql://sop_test:sop_test_password@127.0.0.1:3307/sop_fti_test
      E2E_SEED_PASSWORD: MigrationSmoke-CI-Only-123!

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.21.0
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: server/pnpm-lock.yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Start MariaDB
        run: |
          docker run --detach --name sop-migration-smoke-db --publish 3307:3306 \\
            --env MARIADB_ROOT_PASSWORD=root_test_password \\
            --env MARIADB_DATABASE=sop_fti_test \\
            --env MARIADB_USER=sop_test --env MARIADB_PASSWORD=sop_test_password \\
            --env TZ=Asia/Jakarta mariadb:11.4 --lower_case_table_names=1
      - name: Wait for MariaDB
        run: |
          for attempt in $(seq 1 60); do
            docker exec sop-migration-smoke-db healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 && exit 0
            sleep 2
          done
          docker logs sop-migration-smoke-db
          exit 1
      - name: Validate Prisma schema
        run: pnpm prisma validate
      - name: Generate Prisma client
        run: pnpm prisma generate
      - name: Apply full migration chain
        run: pnpm prisma migrate deploy
      - name: Verify migration status
        run: pnpm prisma migrate status
      - name: Verify migration history completeness
        run: |
          expected="$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
          applied="$(docker exec sop-migration-smoke-db mariadb -uroot -proot_test_password -Nse \"SELECT COUNT(*) FROM sop_fti_test._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL\")"
          test "$applied" = "$expected"
      - name: Seed native FTI graph
        run: pnpm db:seed:e2e
      - name: Prove post-contraction FTI invariants
        run: pnpm db:audit:fti
""",
)

save(
    ".github/workflows/full-fti-exit.yml",
    """name: Full FTI Exit

on:
  pull_request:
    paths:
      - 'server/src/**'
      - 'server/prisma/**'
      - 'server/scripts/full-fti-runtime-audit.cjs'
      - 'server/package.json'
      - 'client/src/**'
      - 'client/e2e/**'
      - '.github/workflows/full-fti-exit.yml'
  push:
    paths:
      - 'server/src/**'
      - 'server/prisma/**'
      - 'server/scripts/full-fti-runtime-audit.cjs'
      - 'server/package.json'
      - 'client/src/**'
      - 'client/e2e/**'
      - '.github/workflows/full-fti-exit.yml'

permissions:
  contents: read

concurrency:
  group: full-fti-exit-${{ github.ref }}
  cancel-in-progress: true

jobs:
  qualify:
    runs-on: ubuntu-latest
    timeout-minutes: 12
    defaults:
      run:
        working-directory: server
    env:
      DATABASE_HOST: 127.0.0.1
      DATABASE_PORT: 3308
      DATABASE_USER: sop_test
      DATABASE_PASSWORD: sop_test_password
      DATABASE_NAME: sop_full_fti_exit
      DATABASE_URL: mysql://sop_test:sop_test_password@127.0.0.1:3308/sop_full_fti_exit
      E2E_SEED_PASSWORD: FullFtiExit-CI-Only-123!

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.21.0
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: server/pnpm-lock.yaml
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Prove FTI-only active source
        run: node scripts/full-fti-runtime-audit.cjs
      - name: Validate and generate Prisma
        run: |
          pnpm prisma validate
          pnpm prisma generate
      - name: Typecheck target runtime
        run: pnpm typecheck
      - name: Verify Process-only contracts
        run: pnpm test:fti-exit
      - name: Start MariaDB
        run: |
          docker run --detach --name sop-full-fti-exit-db --publish 3308:3306 \\
            --env MARIADB_ROOT_PASSWORD=root_test_password \\
            --env MARIADB_DATABASE=sop_full_fti_exit \\
            --env MARIADB_USER=sop_test --env MARIADB_PASSWORD=sop_test_password \\
            --env TZ=Asia/Jakarta mariadb:11.4 --lower_case_table_names=1
      - name: Wait for MariaDB
        run: |
          for attempt in $(seq 1 60); do
            docker exec sop-full-fti-exit-db healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 && exit 0
            sleep 2
          done
          docker logs sop-full-fti-exit-db
          exit 1
      - name: Apply full migration chain
        run: pnpm prisma migrate deploy
      - name: Seed native FTI graph
        run: pnpm db:seed:e2e
      - name: Prove post-contraction database invariants
        run: pnpm db:audit:fti
""",
)

# ---------------------------------------------------------------------------
# S3/S4 — public contract and client cleanup
# ---------------------------------------------------------------------------
def clean_validation_page(text: str) -> str:
    text = text.replace(
        'import type { PeranTTE, TTESignaturePayload } from "@/types/dto/tte.dto";',
        'import type { TTESignaturePayload } from "@/types/dto/tte.dto";',
    )
    text = re.sub(
        r"\nconst HISTORICAL_TTE_ROLE_LABELS:[\s\S]*?\n};\n",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"\nfunction labelPeran\([\s\S]*?\n}\n",
        "\n",
        text,
        count=1,
    )
    text = text.replace(
        '{query.data.authorityLabel ? "Kewenangan" : "Peran historis"}',
        'Kewenangan',
    )
    text = text.replace(
        '{query.data.authorityLabel ?? labelPeran(query.data.peran)}',
        '{query.data.authorityLabel}',
    )
    return text
transform("client/src/pages/validasi/ValidasiPengesahanPage.tsx", clean_validation_page)

replace(
    "client/src/types/dto/tte.dto.ts",
    {"authorityLabel?: string;": 'authorityLabel: "Dekan" | "Kepala Departemen";'},
)

save(
    "client/src/utils/error-codes.ts",
    """export const ErrorCodes = {
  SINGLETON_CONSTRAINT_VIOLATION: 'SINGLETON_CONSTRAINT_VIOLATION',
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',
  USER_NIP_EXISTS: 'USER_NIP_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TIM_ALREADY_EXISTS: 'TIM_ALREADY_EXISTS',
  TIM_NOT_FOUND: 'TIM_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: ErrorCode;
  message: string;
  errors?: string[];
  path: string;
  timestamp: string;
}

export function getUserFriendlyMessage(error: unknown): string {
  if (!error) return 'Terjadi kesalahan tidak diketahui';
  const apiError = error as ApiErrorResponse;

  if (apiError?.code) {
    switch (apiError.code) {
      case ErrorCodes.SINGLETON_CONSTRAINT_VIOLATION:
        return 'Penanggung jawab untuk scope ini sudah tersedia. Periksa struktur organisasi dan kewenangan yang aktif.';
      case ErrorCodes.USER_EMAIL_EXISTS:
        return 'Email sudah terdaftar. Gunakan email lain atau coba login.';
      case ErrorCodes.USER_NIP_EXISTS:
        return 'NIP sudah terdaftar. Gunakan NIP lain atau periksa kembali.';
      case ErrorCodes.TIM_ALREADY_EXISTS:
        return 'User sudah menjadi anggota Process ini.';
      case ErrorCodes.VALIDATION_ERROR:
        return 'Data yang Anda masukkan tidak valid. Periksa kembali form.';
      case ErrorCodes.FORBIDDEN:
        return 'Anda tidak memiliki akses ke fitur ini.';
      case ErrorCodes.UNAUTHORIZED:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      default:
        return apiError.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  if (apiError?.message) return apiError.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan tidak diketahui';
}

export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return (error as ApiErrorResponse)?.code === code;
}
""",
)

delete("client/src/types/dto/tim.dto.ts")

transform(
    "client/src/pages/public/arsip/arsip-search-schema.ts",
    lambda text: re.sub(
        r"\n\s*// Accepted only so old bookmarked OPD-first URLs do not fail route validation\.\n\s*opdId: z\.string\(\)\.optional\(\),\n\s*opdPage: z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.optional\(\),",
        "",
        text,
    ),
)

print(json.dumps({"changed": sorted(set(CHANGED)), "deleted": sorted(set(DELETED))}, indent=2))
