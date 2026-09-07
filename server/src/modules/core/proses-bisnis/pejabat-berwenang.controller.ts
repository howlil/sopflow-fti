import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../auth/helpers/auth.shared';
import { AssignPejabatBerwenangDto } from './dto/pejabat-berwenang.dto';
import { PejabatBerwenangService } from './pejabat-berwenang.service';

@ApiTags('Pejabat Berwenang')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('pejabat-berwenang')
@UseGuards(JwtAuthGuard)
export class PejabatBerwenangController {
  constructor(private readonly service: PejabatBerwenangService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Daftar pejabat berwenang milik pengguna saat ini' })
  async mine(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Pejabat berwenang berhasil diambil',
      success: true,
      data: await this.service.listMine(req.user.sub),
    };
  }

  @Get('configuration')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Daftar konfigurasi Dean dan Kepala Departemen' })
  async configuration(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Konfigurasi pejabat berwenang berhasil diambil',
      success: true,
      data: await this.service.listConfiguration(),
    };
  }

  @Put('dean')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Tetapkan Dean aktif untuk persetujuan akhir faculty lingkup' })
  async assignDean(@Body() dto: AssignPejabatBerwenangDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Dean aktif berhasil diperbarui',
      success: true,
      data: await this.service.assignDean(dto.penggunaId),
    };
  }

  @Put('departemen/:departemenId/head')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Tetapkan Kepala Departemen aktif untuk persetujuan akhir department lingkup' })
  async assignDepartemenHead(
    @Param('departemenId', ParseUUIDPipe) departemenId: string,
    @Body() dto: AssignPejabatBerwenangDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Kepala Departemen aktif berhasil diperbarui',
      success: true,
      data: await this.service.assignDepartemenHead(departemenId, dto.penggunaId),
    };
  }
}
