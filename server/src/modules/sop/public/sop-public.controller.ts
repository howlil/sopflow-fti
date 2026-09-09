import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ApiSuccessResponse } from '../../../common';
import type { PaginatedData } from '../../../common/utils/pagination.util';
import type { Response } from 'express';
import { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import { PublicProsesBisnisItemDto } from './dto/public-proses-bisnis-item.dto';
import { PublicSopByProsesBisnisPageDto } from './dto/public-sop-by-proses-bisnis-page.dto';
import { PublicSopDokumenDto } from './dto/public-sop-dokumen.dto';
import { PublicSopItemDto } from './dto/public-sop-item.dto';
import { SopPublicService } from './sop-public.service';

@ApiTags('SOP Publik')
@Controller('sop/public')
export class SopPublicController {
  constructor(private readonly sopPublicService: SopPublicService) {}

  @Get('fti/prosesBisnis')
  @ApiOperation({
    summary: 'Daftar Proses Bisnis FTI dengan SOP resmi berlaku',
    description: 'Target-native public discovery melalui SOP.prosesBisnisId.',
  })
  async listProsesBisnis(
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PaginatedData<PublicProsesBisnisItemDto>>> {
    return {
      message: 'Daftar Proses Bisnis arsip SOP berhasil diambil',
      success: true,
      data: await this.sopPublicService.listProsesBisnis(query),
    };
  }

  @Get('fti/prosesBisnis/:prosesBisnisId/sop')
  @ApiOperation({
    summary: 'Daftar SOP resmi berlaku per Proses Bisnis FTI',
    description: 'Klasifikasi hanya melalui SOP.prosesBisnisId.',
  })
  @ApiNotFoundResponse({ description: 'Proses Bisnis tidak ditemukan' })
  async listSopByProsesBisnis(
    @Param('prosesBisnisId', ParseUUIDPipe) prosesBisnisId: string,
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PublicSopByProsesBisnisPageDto>> {
    return {
      message: 'Daftar SOP Proses Bisnis berhasil diambil',
      success: true,
      data: await this.sopPublicService.listSopByProsesBisnis(prosesBisnisId, query),
    };
  }

  @Get('fti/sop')
  @ApiOperation({
    summary: 'Cari SOP resmi pada arsip FTI',
    description: 'Mencari SOP resmi FTI berdasarkan kepemilikan Proses Bisnis.',
  })
  async listFtiSopGlobal(
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PaginatedData<PublicSopItemDto>>> {
    return {
      message: 'Hasil pencarian arsip SOP FTI berhasil diambil',
      success: true,
      data: await this.sopPublicService.listFtiSopGlobal(query),
    };
  }

  @Get('dokumen/:detailSopId')
  @ApiOperation({ summary: 'Pratinjau dokumen SOP FTI berlaku' })
  @ApiResponse({ status: 200, type: PublicSopDokumenDto })
  @ApiNotFoundResponse({ description: 'Dokumen tidak ditemukan atau bukan SOP Proses Bisnis-bound berlaku' })
  async getDokumen(
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
  ): Promise<ApiSuccessResponse<PublicSopDokumenDto>> {
    return {
      message: 'Dokumen SOP berlaku berhasil diambil',
      success: true,
      data: await this.sopPublicService.getDokumen(detailSopId),
    };
  }

  @Get('pdf/:detailSopId')
  @ApiOperation({ summary: 'Stream PDF resmi SOP FTI berlaku' })
  @ApiResponse({ status: 200, description: 'PDF SOP resmi' })
  @ApiNotFoundResponse({ description: 'PDF tidak ditemukan' })
  async getPdf(
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.sopPublicService.getPublishedPdf(detailSopId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.sizeBytes),
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(file.buffer);
  }
}
