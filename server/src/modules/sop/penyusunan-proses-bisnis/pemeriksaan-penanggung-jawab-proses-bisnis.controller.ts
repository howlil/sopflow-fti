import {
  Body,
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
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { KeputusanPemeriksaanProsesBisnis, KeputusanPemeriksaanProsesBisnisDto } from './dto/pemeriksaan-proses-bisnis-decision.dto';
import { SubmitPaketPemeriksaanProsesBisnisDto } from './dto/submit-paket-pemeriksaan-proses-bisnis.dto';
import { ProsesBisnisOwnerReviewService } from './pemeriksaan-penanggung-jawab-proses-bisnis.service';

@ApiTags('Pemeriksaan SOP Proses Bisnis')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('prosesBisnis-sop')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisOwnerReviewController {
  constructor(
    private readonly service: ProsesBisnisOwnerReviewService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Post('submit-review-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim beberapa SOP dalam satu Paket Pemeriksaan Proses Bisnis' })
  async submitBatchForReview(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: SubmitPaketPemeriksaanProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Paket Pemeriksaan Proses Bisnis berhasil diajukan',
      success: true,
      data: await this.service.submitBatchForReview(req.user, dto.detailSopIds),
    };
  }

  @Get('review-batches')
  @ApiOperation({ summary: 'Daftar Paket Pemeriksaan Proses Bisnis untuk Penanggung Jawab saat ini' })
  async reviewBatches(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Paket Pemeriksaan Proses Bisnis berhasil dimuat',
      success: true,
      data: await this.service.listForCurrentReviewer(req.user),
    };
  }

  @Post(':detailOrSopId/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kirim SOP terikat Proses Bisnis untuk pemeriksaan Penanggung Jawab Proses Bisnis' })
  async submitForReview(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.submitForReview(req.user, detailOrSopId);
    return {
      message: 'SOP berhasil dikirim kepada Penanggung Jawab Proses Bisnis untuk pemeriksaan',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Post(':detailOrSopId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Penanggung Jawab Proses Bisnis menyetujui atau mengembalikan SOP untuk perbaikan' })
  async review(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: KeputusanPemeriksaanProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.review(
      req.user,
      detailOrSopId,
      dto.decision,
      dto.catatan,
    );
    return {
      message:
        dto.decision === KeputusanPemeriksaanProsesBisnis.ACCEPT
          ? 'SOP disetujui hasil pemeriksaannya dan siap ditandatangani Pejabat yang Berwenang'
          : 'SOP dikembalikan untuk perbaikan',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }
}
