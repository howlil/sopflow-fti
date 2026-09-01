import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Boundary tipe response PengajuanEvaluasi', () => {
  const controllerSource = readFileSync(
    join(__dirname, 'pengajuan-evaluasi.controller.ts'),
    'utf8',
  );
  const serviceSource = readFileSync(join(__dirname, 'pengajuan-evaluasi.service.ts'), 'utf8');
  const mapperSource = readFileSync(join(__dirname, 'pengajuan-evaluasi.mapper.ts'), 'utf8');

  it('controller seharusnya tidak memakai Record<string, unknown> untuk response evaluasi', () => {
    expect(controllerSource).not.toContain('Record<string, unknown>');
  });

  it('service ringkas seharusnya memakai payload konkret', () => {
    expect(serviceSource).not.toContain('PaginatedData<Record<string, unknown>>');
  });

  it('mapper seharusnya mengekspor payload konkret', () => {
    expect(mapperSource).not.toContain('PengajuanEvaluasiApiPayload = Record<string, unknown>');
  });
});
