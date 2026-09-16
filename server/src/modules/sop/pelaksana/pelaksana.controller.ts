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
import { CreatePelaksanaDto } from './dto/create-pelaksana.dto';
import { PelaksanaResponseDto } from './dto/pelaksana-response.dto';
import { UpdatePelaksanaDto } from './dto/update-pelaksana.dto';
import { PelaksanaService } from './pelaksana.service';

@ApiTags('Pelaksana')
@Controller('pelaksana')
@UseGuards(JwtAuthGuard)
export class PelaksanaController {
  constructor(private readonly pelaksanaService: PelaksanaService) {}

  @Get()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Daftar global actor/pelaksana SOP' })
  @ApiResponse({ status: 200, type: [PelaksanaResponseDto] })
  async list(): Promise<ApiSuccessResponse<PelaksanaResponseDto[]>> {
    const data = await this.pelaksanaService.list();
    return {
      message: 'Daftar pelaksana berhasil diambil',
      success: true,
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tambah actor/pelaksana ke katalog global' })
  @ApiResponse({ status: 201, type: PelaksanaResponseDto })
  async create(
    @Req() req: Request & { user: JwtAccessPayload },
    @Body() dto: CreatePelaksanaDto,
  ): Promise<ApiSuccessResponse<PelaksanaResponseDto>> {
    const data = await this.pelaksanaService.create(req.user, dto);
    return {
      message: 'Pelaksana berhasil ditambahkan',
      success: true,
      data,
    };
  }

  @Patch(':id')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Perbarui actor/pelaksana global' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PelaksanaResponseDto })
  async update(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelaksanaDto,
  ): Promise<ApiSuccessResponse<PelaksanaResponseDto>> {
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
  @ApiOperation({ summary: 'Hapus actor/pelaksana global jika belum direferensikan SOP' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<null>> {
    await this.pelaksanaService.remove(req.user, id);
    return {
      message: 'Pelaksana berhasil dihapus',
      success: true,
      data: null,
    };
  }
}
