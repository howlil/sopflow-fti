import {
  Body,
  Controller,
  DefaultValuePipe,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { UpdateSopProsedurDto } from './dto/update-sop-prosedur.dto';
import { SopProsedurService } from './sop-prosedur.service';

@ApiTags('SOP')
@Controller('sop/langkah')
@UseGuards(JwtAuthGuard)
export class SopProsedurController {
  constructor(
    private readonly sopProsedurService: SopProsedurService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Patch(':detailSopId')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({
    summary:
      'PATCH prosedur SOP. Process-bound SOP memakai Process Owner/Member authorization; SOP legacy mempertahankan compatibility penyusun + OPD.',
  })
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    description: 'Jumlah maksimum entri logEdit pada respons penyegaran (1-500, default 100)',
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiResponse({ status: 200, type: PenyusunWorkbenchDataDto })
  @ApiBadRequestResponse({ description: 'Validasi DTO gagal / actor atau tempId tidak konsisten' })
  @ApiConflictResponse({ description: 'Konflik integritas prosedur' })
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: 'DetailSOP tidak ditemukan' })
  async updateProsedur(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
    @Body() dto: UpdateSopProsedurDto,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<PenyusunWorkbenchDataDto>> {
    const data = await this.sopProsedurService.updateProsedur(
      req.user,
      detailSopId,
      dto,
      logsLimit,
    );
    return {
      message: 'Prosedur SOP berhasil diperbarui',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(data),
    };
  }
}
