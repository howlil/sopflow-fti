import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, JwtAuthGuard, PlatformAdminGuard } from '../../../common';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/helpers/auth.shared';
import {
  CreateDepartemenDto,
  CreateProsesBisnisDto,
  UpdateDepartemenDto,
  UpdateProsesBisnisDto,
} from './dto/administrasi-proses-bisnis.dto';
import { ProsesBisnisService } from './process.service';

@ApiTags('Proses Bisnis Admin')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-admin')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class ProsesBisnisController {
  constructor(private readonly processService: ProsesBisnisService) {}

  @Get('departments')
  @ApiOperation({ summary: 'Daftar departemen untuk konteks Proses Bisnis' })
  async listDepartemens(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar departemen berhasil diambil',
      success: true,
      data: await this.processService.listDepartemens(),
    };
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah departemen' })
  async createDepartemen(@Body() dto: CreateDepartemenDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil ditambahkan',
      success: true,
      data: await this.processService.createDepartemen(dto),
    };
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Perbarui departemen' })
  async updateDepartemen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartemenDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil diperbarui',
      success: true,
      data: await this.processService.updateDepartemen(id, dto),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Daftar pengguna aktif yang dapat ditugaskan ke Proses Bisnis Team' })
  async listUsers(@Query('search') search?: string): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar pengguna berhasil diambil',
      success: true,
      data: await this.processService.listAssignableUsers(search),
    };
  }

  @Get('processes')
  @ApiOperation({ summary: 'Daftar Proses Bisnis beserta owner dan members' })
  async listProsesBisnises(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar Proses Bisnis berhasil diambil',
      success: true,
      data: await this.processService.listProsesBisnises(),
    };
  }

  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat Proses Bisnis dan Proses Bisnis Team' })
  async createProsesBisnis(@Body() dto: CreateProsesBisnisDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil dibuat',
      success: true,
      data: await this.processService.createProsesBisnis(dto),
    };
  }

  @Patch('processes/:id')
  @ApiOperation({ summary: 'Perbarui Proses Bisnis dan Proses Bisnis Team' })
  async updateProsesBisnis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil diperbarui',
      success: true,
      data: await this.processService.updateProsesBisnis(id, dto),
    };
  }
}
