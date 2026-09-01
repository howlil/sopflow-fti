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
import { ProcessFinalApprovalService } from './process-final-approval.service';

@ApiTags('Process Final Approval')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-approval')
@UseGuards(JwtAuthGuard)
export class ProcessFinalApprovalController {
  constructor(
    private readonly service: ProcessFinalApprovalService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar SOP yang berada pada approval scope pengguna saat ini' })
  async list(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar final approval berhasil diambil',
      success: true,
      data: await this.service.listForCurrentApprover(req.user),
    };
  }

  @Get(':detailOrSopId/document')
  @ApiOperation({ summary: 'Dokumen SOP read-only untuk final approval dan contextual TTE' })
  async document(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.getDocumentForCurrentApprover(req.user, detailOrSopId);
    return {
      message: 'Dokumen final approval berhasil diambil',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Get(':detailOrSopId')
  @ApiOperation({ summary: 'Context final approver untuk Process-bound SOP' })
  async context(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Context final approval berhasil diambil',
      success: true,
      data: await this.service.getContext(req.user, detailOrSopId),
    };
  }

  @Post(':detailOrSopId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Final approval oleh Dean/Kepala Departemen sesuai Process scope' })
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
