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
import { UpdateSopHeaderDto } from '../catalog/dto/update-sop-header.dto';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { CreateProcessSopDto } from './dto/create-process-sop.dto';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@ApiTags('Process SOP Authoring')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-sop')
@UseGuards(JwtAuthGuard)
export class ProcessSopAuthoringController {
  constructor(
    private readonly service: ProcessSopAuthoringService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar SOP legacy + Process yang dapat diakses pengguna' })
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
