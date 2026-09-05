import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ProcessReviewDecision {
  REVISION = 'REVISION',
  ACCEPT = 'ACCEPT',
}

export class ProcessReviewDecisionDto {
  @ApiProperty({ enum: ProcessReviewDecision })
  @IsEnum(ProcessReviewDecision)
  decision!: ProcessReviewDecision;

  @ApiPropertyOptional({
    description: 'Catatan perbaikan; wajib diisi ketika keputusan REVISION.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  catatan?: string;
}
