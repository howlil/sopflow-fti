import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse } from '../../../common';
import type { PaginatedData } from '../../../common/utils/pagination.util';
import type { Response } from 'express';
import { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import { PublicOpdItemDto } from './dto/public-opd-item.dto';
import { PublicProcessItemDto } from './dto/public-process-item.dto';
import { PublicSopByOpdPageDto } from './dto/public-sop-by-opd-page.dto';
import { PublicSopByProcessPageDto } from './dto/public-sop-by-process-page.dto';
import { PublicSopDokumenDto } from './dto/public-sop-dokumen.dto';
import { PublicSopItemDto } from './dto/public-sop-item.dto';
import { SopPublicService } from './sop-public.service';

@ApiTags('SOP Publik')
@Controller('sop/public')
export class SopPublicController {
  constructor(private readonly sopPublicService: SopPublicService) {}

  @Get('opd')
  @ApiOperation({
    summary: 'Daftar OPD dengan SOP berlaku (arsip publik legacy)',
    description:
      'Compatibility endpoint. Tidak memerlukan autentikasi. Hanya OPD yang memiliki minimal satu SOP berstatus BERLAKU.',
  })
  @ApiResponse({ status: 200, description: 'Daftar OPD terpaginated' })
  async listOpd(
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PaginatedData<PublicOpdItemDto>>> {
    const data = await this.sopPublicService.listOpd(query);
    return {
      message: 'Daftar OPD arsip SOP berhasil diambil',
      success: true,
      data,
    };
  }

  @Get('sop')
  @ApiOperation({
    summary: 'Cari SOP berlaku lintas OPD (arsip publik legacy)',
    description:
      'Compatibility endpoint. Pencarian judul, nomor SOP, atau nama OPD. Hanya status BERLAKU.',
  })
  @ApiResponse({ status: 200, description: 'Daftar SOP terpaginated' })
  async listSopGlobal(
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PaginatedData<PublicSopItemDto>>> {
    const data = await this.sopPublicService.listSopGlobal(query);
    return {
      message: 'Hasil pencarian SOP arsip berhasil diambil',
      success: true,
      data,
    };
  }

  @Get('opd/:opdId/sop')
  @ApiOperation({
    summary: 'Daftar SOP berlaku per OPD (arsip publik legacy)',
    description: 'Compatibility endpoint. Hanya DetailSOP berstatus BERLAKU.',
  })
  @ApiResponse({ status: 200, description: 'Daftar SOP terpaginated beserta meta OPD' })
  @ApiNotFoundResponse({ description: 'OPD tidak ditemukan' })
  async listSopByOpd(
    @Param('opdId', ParseUUIDPipe) opdId: string,
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PublicSopByOpdPageDto>> {
    const data = await this.sopPublicService.listSopByOpd(opdId, query);
    return {
      message: 'Daftar SOP berlaku berhasil diambil',
      success: true,
      data,
    };
  }

  @Get('fti/processes')
  @ApiOperation({
    summary: 'Daftar Process FTI dengan SOP resmi berlaku',
    description:
      'Target-native public discovery. Mengelompokkan Process berdasarkan scope Fakultas/Departemen dan hanya menampilkan Process yang memiliki artifact SOP resmi published.',
  })
  async listProcess(
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PaginatedData<PublicProcessItemDto>>> {
    return {
      message: 'Daftar Process arsip SOP berhasil diambil',
      success: true,
      data: await this.sopPublicService.listProcess(query),
    };
  }

  @Get('fti/processes/:processId/sop')
  @ApiOperation({
    summary: 'Daftar SOP resmi berlaku per Process FTI',
    description:
      'Target-native public discovery melalui SOP.processId. Legacy SOP.opdId bukan sumber klasifikasi untuk endpoint ini.',
  })
  @ApiNotFoundResponse({ description: 'Process tidak ditemukan' })
  async listSopByProcess(
    @Param('processId', ParseUUIDPipe) processId: string,
    @Query() query: PublicArsipQueryDto,
  ): Promise<ApiSuccessResponse<PublicSopByProcessPageDto>> {
    return {
      message: 'Daftar SOP Process berhasil diambil',
      success: true,
      data: await this.sopPublicService.listSopByProcess(processId, query),
    };
  }

  @Get('fti/sop')
  @ApiOperation({
    summary: 'Cari SOP resmi pada arsip FTI',
    description:
      'Mencari judul, nomor SOP, Process, atau Departemen. Process-bound SOP diklasifikasikan melalui SOP.processId; SOP legacy tanpa Process tetap tersedia satu kali sebagai compatibility result.',
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
  @ApiOperation({
    summary: 'Pratinjau dokumen SOP berlaku (arsip publik)',
    description:
      'Tidak memerlukan autentikasi. Mengembalikan header, lampiran, dan langkah prosedur tanpa log audit.',
  })
  @ApiResponse({ status: 200, type: PublicSopDokumenDto })
  @ApiNotFoundResponse({ description: 'Dokumen tidak ditemukan atau bukan status BERLAKU' })
  async getDokumen(
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
  ): Promise<ApiSuccessResponse<PublicSopDokumenDto>> {
    const data = await this.sopPublicService.getDokumen(detailSopId);
    return {
      message: 'Dokumen SOP berlaku berhasil diambil',
      success: true,
      data,
    };
  }

  @Get('pdf/:detailSopId')
  @ApiOperation({
    summary: 'Stream PDF resmi SOP berlaku',
    description:
      'Tidak memerlukan autentikasi. Server mengecek status BERLAKU dan artifact PDF published setiap request.',
  })
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
