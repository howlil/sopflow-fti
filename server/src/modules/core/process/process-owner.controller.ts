import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import type { JwtAccessPayload } from '../auth/helpers/auth.shared';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import {
  AddProcessMemberDto,
  ArchiveOwnedProcessDto,
  CreateOwnedProcessDto,
  InviteProcessMemberDto,
  RenameOwnedProcessDto,
} from './dto/process-owner.dto';
import { ProcessOwnerService } from './process-owner.service';

@ApiTags('Process Owner Self Service')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-owner')
@UseGuards(JwtAuthGuard)
export class ProcessOwnerController {
  constructor(private readonly service: ProcessOwnerService) {}

  @Get('scopes')
  async scopes(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Scope Process Owner berhasil diambil', success: true, data: await this.service.listScopes(req.user.sub) };
  }

  @Get('processes')
  async processes(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Process milik Anda berhasil diambil', success: true, data: await this.service.listOwnedProcesses(req.user.sub) };
  }

  @Get('users')
  async users(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query('search') search?: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Akun FTI aktif berhasil diambil',
      success: true,
      data: await this.service.listAssignableUsers(req.user.sub, search),
    };
  }

  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  async createProcess(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreateOwnedProcessDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Process berhasil dibuat', success: true, data: await this.service.createProcess(req.user.sub, dto) };
  }

  @Patch('processes/:processId')
  async renameProcess(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: RenameOwnedProcessDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Process berhasil diperbarui', success: true, data: await this.service.renameProcess(req.user.sub, processId, dto) };
  }

  @Post('processes/:processId/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: AddProcessMemberDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Penyusun SOP berhasil ditambahkan', success: true, data: await this.service.addExistingMember(req.user.sub, processId, dto.penggunaId) };
  }

  @Delete('processes/:processId/members/:penggunaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
    @Param('penggunaId', ParseUUIDPipe) penggunaId: string,
  ): Promise<void> {
    await this.service.removeMember(req.user.sub, processId, penggunaId);
  }

  @Post('processes/:processId/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambahkan akun yang sudah ada atau buat undangan onboarding satu kali' })
  async inviteMember(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: InviteProcessMemberDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Onboarding Penyusun SOP berhasil dibuat', success: true, data: await this.service.inviteMember(req.user.sub, processId, dto) };
  }

  @Post('processes/:processId/archive')
  async archiveProcess(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: ArchiveOwnedProcessDto,
  ): Promise<ApiSuccessResponse<null>> {
    await this.service.archiveProcess(req.user.sub, processId, dto);
    return { message: 'Process berhasil diarsipkan', success: true, data: null };
  }

  @Get('processes/:processId/audit')
  async audit(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processId', ParseUUIDPipe) processId: string,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Audit Process berhasil diambil', success: true, data: await this.service.listAudit(req.user.sub, processId) };
  }
}
