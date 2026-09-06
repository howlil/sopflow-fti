import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse } from '../../../common';
import { AcceptProcessInvitationDto } from './dto/process-owner.dto';
import { ProcessOwnerService } from './process-owner.service';

@ApiTags('Process Invitations')
@Controller('process-invitations')
export class ProcessInvitationController {
  constructor(private readonly service: ProcessOwnerService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Preview undangan onboarding Process tanpa autentikasi' })
  async preview(@Param('token') token: string): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Undangan berhasil diambil', success: true, data: await this.service.previewInvitation(token) };
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Aktivasi akun dari undangan; pengguna menetapkan sandinya sendiri' })
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptProcessInvitationDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return { message: 'Akun berhasil diaktifkan dan ditambahkan ke Process', success: true, data: await this.service.acceptInvitation(token, dto) };
  }
}
