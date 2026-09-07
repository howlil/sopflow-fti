import {
  Body,
  Controller,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { KeputusanPemeriksaanProsesBisnis, KeputusanPemeriksaanProsesBisnisDto } from './dto/pemeriksaan-proses-bisnis-decision.dto';
import { ProsesBisnisOwnerReviewService } from './process-owner-review.service';

@ApiTags('Penanggung Jawab Proses Bisnis Review')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-sop')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisOwnerReviewController {
  constructor(
    private readonly service: ProsesBisnisOwnerReviewService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Post(':detailOrSopId/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiOperation({ summary: 'Submit Proses Bisnis-bound SOP untuk review Penanggung Jawab Proses Bisnis' })
  async submitForReview(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.submitForReview(req.user, detailOrSopId, logsLimit);
    return {
      message: 'SOP berhasil dikirim ke Penanggung Jawab Proses Bisnis untuk review',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Post(':detailOrSopId/review')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiOperation({ summary: 'Penanggung Jawab Proses Bisnis menerima SOP atau mengembalikannya untuk revisi' })
  async review(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: KeputusanPemeriksaanProsesBisnisDto,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.review(
      req.user,
      detailOrSopId,
      dto.decision,
      dto.catatan,
      logsLimit,
    );
    return {
      message:
        dto.decision === KeputusanPemeriksaanProsesBisnis.ACCEPT
          ? 'SOP diterima Penanggung Jawab Proses Bisnis dan siap menuju persetujuan akhir'
          : 'SOP dikembalikan untuk revisi',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }
}
