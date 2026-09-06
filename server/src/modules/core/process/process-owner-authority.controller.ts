import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import type { JwtAccessPayload } from '../auth/helpers/auth.shared';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import { GrantProcessOwnerAuthorityDto } from './dto/process-owner.dto';
import { ProcessOwnerAuthorityService } from './process-owner-authority.service';

@ApiTags('Process Owner Authority Admin')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-admin/owner-authorities')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class ProcessOwnerAuthorityController {
  constructor(private readonly service: ProcessOwnerAuthorityService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar kewenangan aktif untuk menjadi Process Owner' })
  async list(): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Kewenangan Process Owner berhasil diambil', success: true, data: await this.service.listConfiguration() };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Berikan kewenangan Process Owner pada scope Fakultas/Jurusan' })
  async grant(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: GrantProcessOwnerAuthorityDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Kewenangan Process Owner berhasil diberikan', success: true, data: await this.service.grant(req.user.sub, dto) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cabut kewenangan Process Owner; Process yang sudah dimiliki tetap utuh' })
  async revoke(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.revoke(req.user.sub, id);
  }
}
