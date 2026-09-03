import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import { ListSopQueryDto } from '../catalog/dto/list-sop-query.dto';
import { SopRiwayatVersiRowDto } from '../catalog/dto/sop-riwayat-versi-row.dto';
import { UpdateSopHeaderDto } from '../catalog/dto/update-sop-header.dto';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { CreateProcessSopDto } from './dto/create-process-sop.dto';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';
import { ProcessVersionService } from './process-version.service';

@ApiTags('Process SOP Authoring')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-sop')
@UseGuards(JwtAuthGuard)
export class ProcessSopAuthoringController {
  constructor(
    private readonly service: ProcessSopAuthoringService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
    private readonly processVersionService: ProcessVersionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar SOP native pada Process yang dapat diakses pengguna' })
  async list(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query() query: ListSopQueryDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar SOP berhasil diambil',
      success: true,
      data: await this.service.listForCurrentUser(req.user, query),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat SOP baru di dalam Process yang dimiliki/diikuti pengguna' })
  async create(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreateProcessSopDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'SOP Process berhasil dibuat',
      success: true,
      data: await this.service.create(req.user, dto),
    };
  }

  @Post(':detailOrSopId/version')
  @HttpCode(HttpStatus.CREATED)
  @ApiQuery({ name: 'logsLimit', required: false, schema: { default: 100, minimum: 1, maximum: 500 } })
  @ApiOperation({ summary: 'Buat versi baru dengan Process authorization untuk SOP target' })
  async createVersion(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.processVersionService.createVersion(
      req.user,
      detailOrSopId,
      logsLimit,
    );
    return {
      message: 'Versi baru SOP berhasil dibuat',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Get(':sopId/history')
  @ApiOperation({ summary: 'Riwayat versi SOP dengan Process authorization untuk SOP target' })
  async history(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('sopId', ParseUUIDPipe) sopId: string,
  ): Promise<ApiSuccessResponse<SopRiwayatVersiRowDto[]>> {
    return {
      message: 'Riwayat versi SOP berhasil diambil',
      success: true,
      data: await this.processVersionService.getVersionHistory(req.user, sopId),
    };
  }

  @Delete(':detailSopId/versi-draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus draft revisi melalui Process authorization' })
  async deleteVersionDraft(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
  ): Promise<ApiSuccessResponse<null>> {
    await this.service.deleteVersionDraft(req.user, detailSopId);
    return { message: 'Versi draft berhasil dihapus', success: true, data: null };
  }

  @Delete(':detailSopId/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus draft awal melalui Process authorization' })
  async deleteInitialDraft(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
  ): Promise<ApiSuccessResponse<null>> {
    await this.service.deleteInitialDraft(req.user, detailSopId);
    return { message: 'Draft SOP berhasil dihapus', success: true, data: null };
  }

  @Get('workbench/:detailOrSopId')
  @ApiQuery({ name: 'logsLimit', required: false, schema: { default: 100, minimum: 1, maximum: 500 } })
  @ApiOperation({ summary: 'Workbench SOP dengan Process authorization untuk SOP target' })
  async workbench(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.getWorkbench(req.user, detailOrSopId, logsLimit);
    return {
      message: 'Workbench SOP berhasil diambil',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Patch('header/:detailOrSopId')
  @ApiQuery({ name: 'logsLimit', required: false, schema: { default: 100, minimum: 1, maximum: 500 } })
  @ApiOperation({ summary: 'Perbarui header draft dengan Process authorization untuk SOP target' })
  async updateHeader(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: UpdateSopHeaderDto,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.updateHeader(req.user, detailOrSopId, dto, logsLimit);
    return {
      message: 'Header SOP berhasil diperbarui',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }
}
