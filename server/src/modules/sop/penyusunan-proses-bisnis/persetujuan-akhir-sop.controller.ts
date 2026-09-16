import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { PersetujuanAkhirSOPService } from './persetujuan-akhir-sop.service';

@ApiTags('Proses Bisnis Siklus SOP')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('persetujuan-proses-bisnis')
@UseGuards(JwtAuthGuard)
export class PersetujuanAkhirSOPController {
  constructor(
    private readonly service: PersetujuanAkhirSOPService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Preview lifecycle SOP pada lingkup kewenangan organisasi pengguna saat ini' })
  async list(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Pratinjau siklus SOP berhasil diambil',
      success: true,
      data: await this.service.listLifecycleForCurrentAuthority(req.user),
    };
  }

  @Get('tte-queue')
  @ApiOperation({ summary: 'Daftar SOP yang akan dan telah ditandatangani pengguna' })
  async tteQueue(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar SOP untuk Tanda Tangan Elektronik berhasil diambil',
      success: true,
      data: await this.service.listForCurrentSigner(req.user),
    };
  }

  @Get(':detailOrSopId/document')
  @ApiOperation({ summary: 'Dokumen SOP read-only untuk pratinjau siklus dan Tanda Tangan Elektronik berbasis lingkup kewenangan' })
  async document(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    const document = await this.service.getDocumentForCurrentSigner(req.user, detailOrSopId);
    return {
      message: 'Pratinjau siklus SOP berhasil diambil',
      success: true,
      data: {
        ...document,
        workbench: await this.pelaksanaSnapshotService.applyToWorkbench(document.workbench),
      },
    };
  }

}
