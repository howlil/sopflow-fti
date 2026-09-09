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
} from './dto/penanggung-jawab-proses-bisnis.dto';
import { PenanggungJawabProsesBisnisService } from './penanggung-jawab-proses-bisnis.service';

@ApiTags('Penanggung Jawab Proses Bisnis Self Service')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('penanggung-jawab-proses-bisnis')
@UseGuards(JwtAuthGuard)
export class PenanggungJawabProsesBisnisController {
  constructor(private readonly service: PenanggungJawabProsesBisnisService) {}

  @Get('scopes')
  async scopes(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Lingkup Penanggung Jawab Proses Bisnis berhasil diambil',
      success: true,
      data: await this.service.listLingkup(req.user.sub),
    };
  }

  @Get('proses-bisnis')
  async prosesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis milik Anda berhasil diambil',
      success: true,
      data: await this.service.listOwnedProsesBisnis(req.user.sub),
    };
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

  @Post('proses-bisnis')
  @HttpCode(HttpStatus.CREATED)
  async createProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreateOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil dibuat',
      success: true,
      data: await this.service.createProsesBisnis(req.user.sub, dto),
    };
  }

  @Patch('proses-bisnis/:prosesBisnisId')
  async renameProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: RenameOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil diperbarui',
      success: true,
      data: await this.service.renameProsesBisnis(req.user.sub, prosesBisnisId, dto),
    };
  }

  @Post('proses-bisnis/:prosesBisnisId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: AddAnggotaProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Penyusun SOP berhasil ditambahkan',
      success: true,
      data: await this.service.tambahAnggotaTerdaftar(req.user.sub, prosesBisnisId, dto.penggunaId),
    };
  }

  @Delete('proses-bisnis/:prosesBisnisId/members/:penggunaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hapusAnggota(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Param('penggunaId', ParseUUIDPipe) penggunaId: string,
  ): Promise<void> {
    await this.service.hapusAnggota(req.user.sub, prosesBisnisId, penggunaId);
  }

  @Post('proses-bisnis/:prosesBisnisId/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambahkan akun yang sudah ada atau buat undangan onboarding satu kali',
  })
  async undangAnggota(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: InviteAnggotaProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Onboarding Penyusun SOP berhasil dibuat',
      success: true,
      data: await this.service.undangAnggota(req.user.sub, prosesBisnisId, dto),
    };
  }

  @Post('proses-bisnis/:prosesBisnisId/archive')
  async archiveProsesBisnis(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Body() dto: ArchiveOwnedProsesBisnisDto,
  ): Promise<ApiSuccessResponse<null>> {
    await this.service.archiveProsesBisnis(req.user.sub, prosesBisnisId, dto);
    return { message: 'Proses Bisnis berhasil diarsipkan', success: true, data: null };
  }

  @Get('proses-bisnis/:prosesBisnisId/audit')
  async audit(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Audit Proses Bisnis berhasil diambil',
      success: true,
      data: await this.service.listRiwayatAktivitas(req.user.sub, prosesBisnisId),
    };
  }
}
