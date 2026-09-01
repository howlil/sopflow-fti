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
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import { PelaksanaSnapshotService } from '../pelaksana/pelaksana-snapshot.service';
import { ProcessReviewDecisionDto } from './dto/process-review-decision.dto';
import { ProcessOwnerReviewService } from './process-owner-review.service';

@ApiTags('Process Owner Review')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-sop')
@UseGuards(JwtAuthGuard)
export class ProcessOwnerReviewController {
  constructor(
    private readonly service: ProcessOwnerReviewService,
    private readonly pelaksanaSnapshotService: PelaksanaSnapshotService,
  ) {}

  @Post(':detailOrSopId/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'logsLimit', required: false, schema: { default: 100, minimum: 1, maximum: 500 } })
  @ApiOperation({ summary: 'Submit Process-bound SOP untuk review Process Owner' })
  async submitForReview(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.submitForReview(req.user, detailOrSopId, logsLimit);
    return {
      message: 'SOP berhasil dikirim ke Process Owner untuk review',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }

  @Post(':detailOrSopId/review')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'logsLimit', required: false, schema: { default: 100, minimum: 1, maximum: 500 } })
  @ApiOperation({ summary: 'Process Owner menerima SOP atau mengembalikannya untuk revisi' })
  async review(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: ProcessReviewDecisionDto,
    @Query('logsLimit', new DefaultValuePipe(100), ParseIntPipe) logsLimit: number,
  ): Promise<ApiSuccessResponse<unknown>> {
    const workbench = await this.service.review(req.user, detailOrSopId, dto.decision, logsLimit);
    return {
      message:
        dto.decision === 'ACCEPT'
          ? 'SOP diterima Process Owner dan siap menuju final approval'
          : 'SOP dikembalikan untuk revisi',
      success: true,
      data: await this.pelaksanaSnapshotService.applyToWorkbench(workbench),
    };
  }
}
