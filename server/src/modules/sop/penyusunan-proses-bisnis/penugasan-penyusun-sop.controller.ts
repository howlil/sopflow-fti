import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { AssignPenyusunSopDto } from './dto/penugasan-penyusun-sop.dto';
import { PenugasanPenyusunSopService } from './penugasan-penyusun-sop.service';

@ApiTags('Penugasan Penyusun SOP')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('penanggung-jawab-proses-bisnis')
@UseGuards(JwtAuthGuard)
export class PenugasanPenyusunSopController {
  constructor(private readonly service: PenugasanPenyusunSopService) {}

  @Get('proses-bisnis/:prosesBisnisId/penugasan-sop')
  @ApiOperation({ summary: 'Daftar SOP dan Penyusun utama untuk Proses Bisnis milik PJ' })
  async list(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar penugasan Penyusun SOP berhasil diambil',
      success: true,
      data: await this.service.listForOwner(req.user.sub, prosesBisnisId),
    };
  }

  @Put('sop/:sopId/penyusun')
  @ApiOperation({ summary: 'Tetapkan atau ganti Penyusun utama SOP' })
  async assign(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('sopId', ParseUUIDPipe) sopId: string,
    @Body() dto: AssignPenyusunSopDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Penyusun utama SOP berhasil ditetapkan',
      success: true,
      data: await this.service.assign(req.user.sub, sopId, dto.penggunaId),
    };
  }
}
