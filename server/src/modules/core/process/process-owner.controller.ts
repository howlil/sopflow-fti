import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import type { JwtAccessPayload } from '../auth/helpers/auth.shared';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import {
  AddAnggotaProsesBisnisDto,
  ArchiveOwnedProsesBisnisDto,
  CreateOwnedProsesBisnisDto,
  InviteAnggotaProsesBisnisDto,
  RenameOwnedProsesBisnisDto,
} from './dto/process-owner.dto';
import { ProsesBisnisOwnerService } from './process-owner.service';

@ApiTags('Penanggung Jawab Proses Bisnis Self Service')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-owner')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisOwnerController {
  constructor(private readonly service: ProsesBisnisOwnerService) {}

  @Get('scopes')
  async scopes(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Scope Penanggung Jawab Proses Bisnis berhasil diambil', success: true, data: await this.service.listScopes(req.user.sub) };
  }

  @Get('processes')
  async processes(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Proses Bisnis milik Anda berhasil diambil', success: true, data: await this.service.listOwnedProsesBisnises(req.user.sub) };
  }

  @Get('users')
  async users(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query('search') search?: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Akun FTI aktif berhasil diambil',
      success: true,
      data: await this.service.listAssignableUsers(req.user.sub, search),
    };
  }

  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  async createProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreateOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Proses Bisnis berhasil dibuat', success: true, data: await this.service.createProsesBisnis(req.user.sub, dto) };
  }

  @Patch('processes/:prosesBisnisId')
  async renameProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: RenameOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Proses Bisnis berhasil diperbarui', success: true, data: await this.service.renameProsesBisnis(req.user.sub, prosesBisnisId, dto) };
  }

  @Post('processes/:prosesBisnisId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: AddAnggotaProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Penyusun SOP berhasil ditambahkan', success: true, data: await this.service.addExistingMember(req.user.sub, prosesBisnisId, dto.penggunaId) };
  }

  @Delete('processes/:prosesBisnisId/members/:penggunaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Param('penggunaId', ParseUUIDPipe) penggunaId: string,
  ): Promise<void> {
    await this.service.removeMember(req.user.sub, prosesBisnisId, penggunaId);
  }

  @Post('processes/:prosesBisnisId/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambahkan akun yang sudah ada atau buat undangan onboarding satu kali' })
  async inviteMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: InviteAnggotaProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Onboarding Penyusun SOP berhasil dibuat', success: true, data: await this.service.inviteMember(req.user.sub, prosesBisnisId, dto) };
  }

  @Post('processes/:prosesBisnisId/archive')
  async archiveProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: ArchiveOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<null>> {
    await this.service.archiveProsesBisnis(req.user.sub, prosesBisnisId, dto);
    return { message: 'Proses Bisnis berhasil diarsipkan', success: true, data: null };
  }

  @Get('processes/:prosesBisnisId/audit')
  async audit(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Audit Proses Bisnis berhasil diambil', success: true, data: await this.service.listAudit(req.user.sub, prosesBisnisId) };
  }
}
