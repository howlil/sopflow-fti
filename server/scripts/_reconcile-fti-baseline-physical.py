from pathlib import Path

schema_path = Path('server/prisma/schema.prisma')
schema = schema_path.read_text()
replacements = {
    'nohp                      String           @db.VarChar(32)': 'nohp                      String           @db.VarChar(15)',
    'tteP12Base64              String?          @db.Text': 'tteP12Base64              String?          @db.LongText',
    'signatureAlgorithm String?                 @db.VarChar(13)': 'signatureAlgorithm String?                 @db.VarChar(32)',
    'kunciLabel  String       @db.VarChar(8)': 'kunciLabel  String       @db.VarChar(255)',
    'updatedAt   DateTime @updatedAt @db.DateTime(3)': 'updatedAt   DateTime @default(now()) @updatedAt @db.DateTime(3)',
}
for old, new in replacements.items():
    count = schema.count(old)
    expected = 2 if old == 'updatedAt   DateTime @updatedAt @db.DateTime(3)' else 1
    if count != expected:
        raise SystemExit(f'Expected {expected} schema match(es) for {old!r}, found {count}')
    schema = schema.replace(old, new)
schema_path.write_text(schema)

baseline_path = Path('server/prisma/migrations/0_fti_native_baseline/migration.sql')
baseline = baseline_path.read_text()
for old, new in {
    '`nohp` VARCHAR(32) NOT NULL': '`nohp` VARCHAR(15) NOT NULL',
    '`tteP12Base64` TEXT NULL': '`tteP12Base64` LONGTEXT NULL',
    '`signatureAlgorithm` VARCHAR(13) NULL': '`signatureAlgorithm` VARCHAR(32) NULL',
    '`kunciLabel` VARCHAR(8) NOT NULL': '`kunciLabel` VARCHAR(255) NOT NULL',
}.items():
    if baseline.count(old) != 1:
        raise SystemExit(f'Expected one baseline match for {old!r}')
    baseline = baseline.replace(old, new)

for table in ('PelaksanaAuditAttribution', 'DetailSOPPelaksanaSnapshot'):
    start = baseline.index(f'CREATE TABLE `{table}` (')
    end = baseline.index(') DEFAULT CHARACTER SET', start)
    block = baseline[start:end]
    old = '`updatedAt` DATETIME(3) NOT NULL'
    if block.count(old) != 1:
        raise SystemExit(f'Expected updatedAt in {table}')
    block = block.replace(old, '`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)', 1)
    baseline = baseline[:start] + block + baseline[end:]

pengguna_start = baseline.index('CREATE TABLE `Pengguna` (')
pengguna_end = baseline.index(') DEFAULT CHARACTER SET', pengguna_start)
pengguna = baseline[pengguna_start:pengguna_end]
check = "    CONSTRAINT `Pengguna_nohp_format_chk` CHECK (`nohp` REGEXP '^628[0-9]{7,12}$'),\n"
if 'Pengguna_nohp_format_chk' not in pengguna:
    marker = '    PRIMARY KEY (`penggunaId`)'
    pengguna = pengguna.replace(marker, check + marker, 1)
    baseline = baseline[:pengguna_start] + pengguna + baseline[pengguna_end:]
baseline_path.write_text(baseline)
