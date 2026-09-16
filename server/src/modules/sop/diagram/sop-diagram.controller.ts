import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import { UseGuards } from '@nestjs/common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { UpdateSopDiagramDto } from './dto/diagram-path-overrides.dto';
import { SopDiagramService } from './sop-diagram.service';

@ApiTags('SOP')
@Controller('process-sop/diagram')
@UseGuards(JwtAuthGuard)
export class SopDiagramController {
  constructor(private readonly sopDiagramService: SopDiagramService) {}

  @Patch(':detailSopId')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({
    summary:
      'PATCH konfigurasi diagram SOP Proses Bisnis-bound (layoutSeed + path manual). Param :detailSopId boleh DetailSOP atau SOP header.',
  })
  @ApiResponse({ status: 200, type: PenyusunWorkbenchDataDto })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async updateDiagram(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
    @Body() dto: UpdateSopDiagramDto,
  ): Promise<ApiSuccessResponse<PenyusunWorkbenchDataDto>> {
    const data = await this.sopDiagramService.updateDiagram(req.user, detailSopId, dto);
    return {
      message: 'Konfigurasi diagram berhasil diperbarui',
      success: true,
      data,
    };
  }
}
