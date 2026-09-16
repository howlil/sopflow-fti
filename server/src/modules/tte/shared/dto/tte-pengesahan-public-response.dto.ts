import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Bukti tanda tangan cocok dengan record pengesahan server.' })
  signatureValid!: boolean;

  @ApiProperty({
    enum: ['CURRENT', 'REVOKED', 'SUPERSEDED', 'NOT_PUBLIC'],
    description:
      'Status keberlakuan publik SOP saat ini; berbeda dari validitas historis tanda tangan.',
  })
  currentPublicStatus!: 'CURRENT' | 'REVOKED' | 'SUPERSEDED' | 'NOT_PUBLIC';

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
