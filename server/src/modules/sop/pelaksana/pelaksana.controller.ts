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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import { CreatePelaksanaDto } from './dto/create-pelaksana.dto';
import { PelaksanaResponseDto } from './dto/pelaksana-response.dto';
import { UpdatePelaksanaDto } from './dto/update-pelaksana.dto';
import { PelaksanaService } from './pelaksana.service';

@ApiTags('Pelaksana')
@Controller('pelaksana')
@UseGuards(JwtAuthGuard)
export class PelaksanaController {
  constructor(
    private readonly pelaksanaService: PelaksanaService,
    private readonly prosesBisnisContextService: ProsesBisnisContextService,
  ) {}

  @Get()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Daftar katalog Pelaksana global FTI' })
  @ApiResponse({ status: 200, type: [PelaksanaResponseDto] })
  async list(): Promise<ApiSuccessResponse<PelaksanaResponseDto[]>> {
    const data = await this.pelaksanaService.list();
    return {
      message: 'Daftar Pelaksana berhasil diambil',
      success: true,
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tambah Pelaksana ke katalog global FTI' })
  @ApiResponse({ status: 201, type: PelaksanaResponseDto })
  async create(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreatePelaksanaDto,
  ): Promise<ApiSuccessResponse<PelaksanaResponseDto>> {
    await this.prosesBisnisContextService.assertCanManageGlobalCatalog(req.user.sub);
    const data = await this.pelaksanaService.create(req.user, dto);
    return {
      message: 'Pelaksana berhasil ditambahkan',
      success: true,
      data,
    };
  }

  @Patch(':id')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Perbarui Pelaksana global' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PelaksanaResponseDto })
  async update(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelaksanaDto,
  ): Promise<ApiSuccessResponse<PelaksanaResponseDto>> {
    await this.prosesBisnisContextService.assertCanManageGlobalCatalog(req.user.sub);
    const data = await this.pelaksanaService.update(req.user, id, dto);
    return {
      message: 'Pelaksana berhasil diperbarui',
      success: true,
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Hapus Pelaksana global jika belum direferensikan SOP' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<null>> {
    await this.prosesBisnisContextService.assertCanManageGlobalCatalog(req.user.sub);
    await this.pelaksanaService.remove(req.user, id);
    return {
      message: 'Pelaksana berhasil dihapus',
      success: true,
      data: null,
    };
  }
}
