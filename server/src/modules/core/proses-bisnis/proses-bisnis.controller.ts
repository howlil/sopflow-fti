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
import { ProsesBisnisService } from './proses-bisnis.service';

@ApiTags('Proses Bisnis Admin')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('administrasi-proses-bisnis')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class ProsesBisnisController {
  constructor(private readonly prosesBisnisService: ProsesBisnisService) {}

  @Get('departemen')
  @ApiOperation({ summary: 'Daftar departemen untuk konteks Proses Bisnis' })
  async listDepartemen(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar departemen berhasil diambil',
      success: true,
      data: await this.prosesBisnisService.listDepartemen(),
    };
  }

  @Post('departemen')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah departemen' })
  async createDepartemen(@Body() dto: CreateDepartemenDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil ditambahkan',
      success: true,
      data: await this.prosesBisnisService.createDepartemen(dto),
    };
  }

  @Patch('departemen/:id')
  @ApiOperation({ summary: 'Perbarui departemen' })
  async updateDepartemen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartemenDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil diperbarui',
      success: true,
      data: await this.prosesBisnisService.updateDepartemen(id, dto),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Daftar pengguna aktif yang dapat ditugaskan ke Tim Proses Bisnis' })
  async listUsers(@Query('search') search?: string): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar pengguna berhasil diambil',
      success: true,
      data: await this.prosesBisnisService.listAssignableUsers(search),
    };
  }

  @Get('proses-bisnis')
  @ApiOperation({ summary: 'Daftar Proses Bisnis beserta penanggung jawab dan anggota' })
  async listProsesBisnis(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar Proses Bisnis berhasil diambil',
      success: true,
      data: await this.prosesBisnisService.listProsesBisnis(),
    };
  }

  @Post('proses-bisnis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat Proses Bisnis dan Tim Proses Bisnis' })
  async createProsesBisnis(@Body() dto: CreateProsesBisnisDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil dibuat',
      success: true,
      data: await this.prosesBisnisService.createProsesBisnis(dto),
    };
  }

  @Patch('prosesBisnis/:id')
  @ApiOperation({ summary: 'Perbarui Proses Bisnis dan Tim Proses Bisnis' })
  async updateProsesBisnis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProsesBisnisDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Proses Bisnis berhasil diperbarui',
      success: true,
      data: await this.prosesBisnisService.updateProsesBisnis(id, dto),
    };
  }
}
