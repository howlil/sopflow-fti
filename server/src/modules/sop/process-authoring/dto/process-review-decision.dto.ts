import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ProcessReviewDecision {
  REVISION = 'REVISION',
  ACCEPT = 'ACCEPT',
}

export class ProcessReviewDecisionDto {
  @ApiProperty({ enum: ProcessReviewDecision })
  @IsEnum(ProcessReviewDecision)
  decision!: ProcessReviewDecision;
}
