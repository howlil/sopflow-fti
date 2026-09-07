import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard, type ApiSuccessResponse } from '../../../common';
import type { JwtAccessPayload } from '../../../common/types/jwt-access-payload.type';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../core/auth/helpers/auth.shared';
import { TandaTanganiProsesBisnisSopDto } from '../shared/dto/tanda-tangani-process-sop.dto';
import { ProsesBisnisTteService } from './tte-proses-bisnis.service';

@ApiTags('Proses Bisnis TTE')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-tte')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisTteController {
  constructor(private readonly service: ProsesBisnisTteService) {}

  @Post(':detailOrSopId/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'TTE contextual Proses Bisnis-bound SOP oleh Dean/Kepala Departemen yang memberi persetujuan akhir',
  })
  async sign(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: TandaTanganiProsesBisnisSopDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'SOP berhasil ditandatangani dan diberlakukan',
      success: true,
      data: await this.service.sign(req.user, detailOrSopId, dto, req),
    };
  }
}
