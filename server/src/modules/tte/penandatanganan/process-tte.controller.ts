import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard, type ApiSuccessResponse } from '../../../common';
import type { JwtAccessPayload } from '../../../common/types/jwt-access-payload.type';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../core/auth/helpers/auth.shared';
import { TandaTanganiProcessSopDto } from '../shared/dto/tanda-tangani-process-sop.dto';
import { ProcessTteService } from './process-tte.service';

@ApiTags('Process TTE')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-tte')
@UseGuards(JwtAuthGuard)
export class ProcessTteController {
  constructor(private readonly service: ProcessTteService) {}

  @Post(':detailOrSopId/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'TTE contextual Process-bound SOP oleh Dean/Kepala Departemen yang memberi final approval',
  })
  async sign(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: TandaTanganiProcessSopDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'SOP berhasil ditandatangani dan diberlakukan',
      success: true,
      data: await this.service.sign(req.user, detailOrSopId, dto, req),
    };
  }
}
