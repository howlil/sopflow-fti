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
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { PersetujuanAkhirSOPService } from './persetujuan-akhir-sop.service';

@ApiTags('Proses Bisnis Persetujuan Akhir')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('persetujuan-proses-bisnis')
@UseGuards(JwtAuthGuard)
export class PersetujuanAkhirSOPController {
  constructor(
    private readonly service: PersetujuanAkhirSOPService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar SOP yang berada pada approval lingkup pengguna saat ini' })
  async list(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar persetujuan akhir berhasil diambil',
      success: true,
      data: await this.service.listForCurrentApprover(req.user),
    };
  }

  @Get(':detailOrSopId/document')
  @ApiOperation({ summary: 'Dokumen SOP read-only untuk persetujuan akhir dan contextual TTE' })
  async document(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    const document = await this.service.getDocumentForCurrentApprover(req.user, detailOrSopId);
    return {
      message: 'Dokumen persetujuan akhir berhasil diambil',
      success: true,
      data: {
        ...document,
        workbench: await this.pelaksanaSnapshotService.applyToWorkbench(document.workbench),
      },
    };
  }

  @Get(':detailOrSopId')
  @ApiOperation({ summary: 'Context final approver untuk Proses Bisnis-bound SOP' })
  async context(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Context persetujuan akhir berhasil diambil',
      success: true,
      data: await this.service.getContext(req.user, detailOrSopId),
    };
  }

  @Post(':detailOrSopId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Final approval oleh Dean/Kepala Departemen sesuai Proses Bisnis lingkup' })
  async approve(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'SOP disetujui dan menunggu proses TTE',
      success: true,
      data: await this.service.approve(req.user, detailOrSopId),
    };
  }
}
