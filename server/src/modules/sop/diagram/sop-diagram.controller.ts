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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
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
// The Process path is the first-party contract; the legacy path remains as a
// compatibility adapter for existing clients and historical SOPs.
@Controller(['process-sop/diagram', 'sop/diagram'])
@UseGuards(JwtAuthGuard)
export class SopDiagramController {
  constructor(private readonly sopDiagramService: SopDiagramService) {}

  @Patch(':detailSopId')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({
    summary:
      'PATCH konfigurasi diagram SOP (layoutSeed + path manual). Param :detailSopId boleh DetailSOP atau SOP header.',
  })
  @ApiQuery({
    name: 'logsLimit',
    required: false,
    schema: { default: 100, minimum: 1, maximum: 500 },
  })
  @ApiResponse({ status: 200, type: PenyusunWorkbenchDataDto })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async updateDiagram(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailSopId', ParseUUIDPipe) detailSopId: string,
    @Body() dto: UpdateSopDiagramDto,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<PenyusunWorkbenchDataDto>> {
    const data = await this.sopDiagramService.updateDiagram(req.user, detailSopId, dto, logsLimit);
    return {
      message: 'Konfigurasi diagram berhasil diperbarui',
      success: true,
      data,
    };
  }
}
