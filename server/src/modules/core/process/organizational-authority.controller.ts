import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME, type JwtAccessPayload } from '../auth/helpers/auth.shared';
import { AssignOrganizationalAuthorityDto } from './dto/organizational-authority.dto';
import { OrganizationalAuthorityService } from './organizational-authority.service';

@ApiTags('Organizational Authority')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('organizational-authority')
@UseGuards(JwtAuthGuard)
export class OrganizationalAuthorityController {
  constructor(private readonly service: OrganizationalAuthorityService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Daftar organizational authority milik pengguna saat ini' })
  async mine(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Organizational authority berhasil diambil',
      success: true,
      data: await this.service.listMine(req.user.sub),
    };
  }

  @Get('configuration')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Daftar konfigurasi Dean dan Kepala Departemen' })
  async configuration(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Konfigurasi organizational authority berhasil diambil',
      success: true,
      data: await this.service.listConfiguration(),
    };
  }

  @Put('dean')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Tetapkan Dean aktif untuk final approval faculty scope' })
  async assignDean(@Body() dto: AssignOrganizationalAuthorityDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Dean aktif berhasil diperbarui',
      success: true,
      data: await this.service.assignDean(dto.penggunaId),
    };
  }

  @Put('departments/:departmentId/head')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Tetapkan Kepala Departemen aktif untuk final approval department scope' })
  async assignDepartmentHead(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() dto: AssignOrganizationalAuthorityDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Kepala Departemen aktif berhasil diperbarui',
      success: true,
      data: await this.service.assignDepartmentHead(departmentId, dto.penggunaId),
    };
  }
}
