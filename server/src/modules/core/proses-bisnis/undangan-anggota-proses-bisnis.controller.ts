import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse } from '../../../common';
import { AcceptUndanganAnggotaProsesBisnisDto } from './dto/penanggung-jawab-proses-bisnis.dto';
import { PenanggungJawabProsesBisnisService } from './penanggung-jawab-proses-bisnis.service';

@ApiTags('Proses Bisnis Invitations')
@Controller('undangan-anggota-proses-bisniss')
export class UndanganAnggotaProsesBisnisController {
  constructor(private readonly service: PenanggungJawabProsesBisnisService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Preview undangan onboarding Proses Bisnis tanpa autentikasi' })
  async preview(@Param('token') token: string): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Undangan berhasil diambil', success: true, data: await this.service.pratinjauUndangan(token) };
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Aktivasi akun dari undangan; pengguna menetapkan sandinya sendiri' })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptUndanganAnggotaProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Akun berhasil diaktifkan dan ditambahkan ke Proses Bisnis', success: true, data: await this.service.terimaUndangan(token, dto) };
  }
}
