import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import { CreatePlatformAccountDto } from './dto/create-platform-account.dto';
import { PlatformAccountService } from './platform-account.service';

@ApiTags('Platform Accounts')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('platform-accounts')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformAccountController {
  constructor(private readonly platformAccountService: PlatformAccountService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar akun aktif untuk administrasi platform FTI' })
  async list(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar akun berhasil diambil',
      success: true,
      data: await this.platformAccountService.list(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat akun USER FTI dengan sandi awal server' })
  async create(@Body() dto: CreatePlatformAccountDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Akun FTI berhasil dibuat',
      success: true,
      data: await this.platformAccountService.create(dto),
    };
  }
}
