import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import type { JwtAccessPayload } from '../auth/helpers/auth.shared';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import { GrantKewenanganPenanggungJawabProsesBisnisDto } from './dto/process-owner.dto';
import { KewenanganPenanggungJawabProsesBisnisService } from './process-owner-authority.service';

@ApiTags('Penanggung Jawab Proses Bisnis Authority Admin')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-admin/owner-authorities')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class KewenanganPenanggungJawabProsesBisnisController {
  constructor(private readonly service: KewenanganPenanggungJawabProsesBisnisService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar kewenangan aktif untuk menjadi Penanggung Jawab Proses Bisnis' })
  async list(): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Kewenangan Penanggung Jawab Proses Bisnis berhasil diambil', success: true, data: await this.service.listConfiguration() };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Berikan kewenangan Penanggung Jawab Proses Bisnis pada scope Fakultas/Jurusan' })
  async grant(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: GrantKewenanganPenanggungJawabProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Kewenangan Penanggung Jawab Proses Bisnis berhasil diberikan', success: true, data: await this.service.grant(req.user.sub, dto) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cabut kewenangan Penanggung Jawab Proses Bisnis; Proses Bisnis yang sudah dimiliki tetap utuh' })
  async revoke(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.revoke(req.user.sub, id);
  }
}
