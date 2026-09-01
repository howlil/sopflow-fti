import { ApiProperty } from '@nestjs/swagger';

export class PelaksanaResponseDto {
  @ApiProperty()
  readonly id!: string;

  @ApiProperty()
  readonly namaPelaksana!: string;

  @ApiProperty({ nullable: true, type: Object })
  readonly createdBy!: { id: string; nama: string } | null;

  @ApiProperty({ nullable: true, type: Object })
  readonly updatedBy!: { id: string; nama: string } | null;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;
}
