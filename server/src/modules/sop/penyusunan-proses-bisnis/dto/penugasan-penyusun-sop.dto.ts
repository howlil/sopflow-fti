import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignPenyusunSopDto {
  @ApiProperty({ format: 'uuid', description: 'Pengguna yang menjadi Penyusun utama SOP' })
  @IsUUID()
  penggunaId!: string;
}
