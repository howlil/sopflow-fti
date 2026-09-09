import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
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
import { ProsesBisnisOwnerReviewService } from './pemeriksaan-penanggung-jawab-proses-bisnis.service';

@ApiTags('Pemeriksaan Penanggung Jawab Proses Bisnis')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('prosesBisnis-sop')
@UseGuards(JwtAuthGuard)
export class ProsesBisnisOwnerReviewController {
  constructor(
    private readonly service: ProsesBisnisOwnerReviewService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Get(':detailOrSopId/review-document')
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiOperation({ summary: 'Dokumen SOP read-only untuk pemeriksaan Penanggung Jawab Proses Bisnis' })
  async reviewDocument(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Dokumen pemeriksaan SOP berhasil diambil',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(
        await this.service.getReviewDocument(req.user, detailOrSopId, logsLimit),
      ),
    };
  }

  @Post(':detailOrSopId/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiOperation({ summary: 'Kirim SOP ke Penanggung Jawab Proses Bisnis untuk pemeriksaan' })
  async submitForReview(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.submitForReview(req.user, detailOrSopId, logsLimit);
    return {
      message: 'SOP berhasil dikirim ke Penanggung Jawab Proses Bisnis untuk pemeriksaan',
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
  @ApiOperation({ summary: 'Penanggung Jawab meminta revisi atau menyatakan SOP siap diajukan' })
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
          ? 'SOP dinyatakan siap diajukan ke Pejabat Berwenang'
          : 'SOP dikembalikan kepada Penyusun untuk revisi',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }
}
