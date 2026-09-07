import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import { ProsesBisnisSopRevocationService } from './sop-proses-bisnis-revocation.service';

@ApiTags('Proses Bisnis SOP Revocation')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-revocation')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisSopRevocationController {
  constructor(private readonly service: ProsesBisnisSopRevocationService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar SOP berlaku yang dapat dicabut oleh authority saat ini' })
  async list(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar SOP berlaku dalam kewenangan berhasil diambil',
      success: true,
      data: await this.service.listForCurrentAuthority(req.user),
    };
  }

  @Post(':detailOrSopId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cabut SOP berlaku oleh Dean/Kepala Departemen sesuai Proses Bisnis scope' })
  async revoke(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'SOP berhasil dicabut dan tidak lagi berlaku',
      success: true,
      data: await this.service.revoke(req.user, detailOrSopId),
    };
  }
}
