import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import type { JwtAccessPayload } from '../auth/helpers/auth.shared';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import { ProcessContextService } from './process-context.service';

@ApiTags('Process Context')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-context')
@UseGuards(JwtAuthGuard)
export class ProcessContextController {
  constructor(private readonly processContextService: ProcessContextService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Daftar Process tempat pengguna menjadi owner atau member' })
  async mine(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Process pengguna berhasil diambil',
      success: true,
      data: await this.processContextService.listForUser(req.user.sub),
    };
  }
}
