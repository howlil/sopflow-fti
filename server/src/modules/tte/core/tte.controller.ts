import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { type ApiSuccessResponse, Roles, UseJwtAndRolesGuards } from '../../../common';
import type { JwtAccessPayload } from '../../../common/types/jwt-access-payload.type';
import { PeranPengguna } from '../../../generated/prisma';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../core/auth/helpers/auth.shared';
import { RegisterTteDto } from '../shared/dto/register-tte.dto';
import { SignPdfDto } from '../shared/dto/sign-pdf.dto';
import { TandaTanganiDto } from '../shared/dto/tanda-tangani.dto';
import { TandaTanganiSemuaSopDto } from '../shared/dto/tanda-tangani-semua-sop.dto';
import { UpdateTtePinDto } from '../shared/dto/update-tte-pin.dto';
import { GenerateP12Dto } from '../shared/dto/generate-p12.dto';
import { UploadP12Dto } from '../shared/dto/upload-p12.dto';
import { SetupTteGenerateDto } from '../shared/dto/setup-tte-generate.dto';
import { SetupTteUploadDto } from '../shared/dto/setup-tte-upload.dto';
import {
  TteService,
  type TteBatchSignSopPengajuanResponse,
  type SignPdfResponse,
  type TteProfilResponse,
  type TteRiwayatResponse,
} from './tte.service';

@ApiTags('TTE')
@Controller('tte')
@UseJwtAndRolesGuards()
export class TteController {
  constructor(private readonly tteService: TteService) {}

  @Get('profil')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Profil kredensial TTE' })
  async getProfil(@Req() req: Request & { user: JwtAccessPayload }): Promise<ApiSuccessResponse<TteProfilResponse | null>> {
    const data = await this.tteService.getProfil(req.user);
    return { message: data === null ? 'Kredensial TTE belum ada' : 'Profil TTE berhasil diambil', success: true, data };
  }

  @Post('profil')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Atur PIN TTE pertama kali' })
  async registerProfil(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: RegisterTteDto): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.registerProfil(req.user, dto);
    return { message: 'PIN TTE berhasil diatur', success: true, data };
  }

  @Patch('profil/pin')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Ubah PIN TTE' })
  async updateProfilPin(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: UpdateTtePinDto): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.updateProfilPin(req.user, dto);
    return { message: 'PIN TTE berhasil diperbarui', success: true, data };
  }

  @Post('profil/generate-p12')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Buat Sertifikat TTE Personal (Sistem)' })
  async generateP12(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: GenerateP12Dto): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.generateP12(req.user, dto);
    return { message: 'Sertifikat P12 personal berhasil dibuat', success: true, data };
  }

  @Post('profil/upload-p12')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Unggah Sertifikat P12 Resmi' })
  async uploadP12(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: UploadP12Dto, @UploadedFile() file: any): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.uploadP12(req.user, dto, file);
    return { message: 'Sertifikat P12 berhasil diunggah', success: true, data };
  }

  @Post('profil/setup/generate')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Setup awal TTE: generate sertifikat P12 otomatis + atur PIN' })
  async setupTteGenerate(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: SetupTteGenerateDto): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.setupTteGenerate(req.user, dto);
    return { message: 'TTE berhasil disiapkan dengan sertifikat otomatis', success: true, data };
  }

  @Post('profil/setup/upload')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Setup awal TTE: unggah sertifikat P12 BSrE + atur PIN' })
  async setupTteWithUpload(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: SetupTteUploadDto, @UploadedFile() file: any): Promise<ApiSuccessResponse<TteProfilResponse>> {
    const data = await this.tteService.setupTteWithUpload(req.user, dto, file);
    return { message: 'TTE berhasil disiapkan dengan sertifikat BSrE', success: true, data };
  }

  @Post('tanda-tangani/ba/:pengajuanId')
  @Roles(PeranPengguna.PJ_EVALUATOR, PeranPengguna.PJ_PENYUSUN)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tanda tangani Berita Acara evaluasi' })
  @ApiResponse({ status: 200, description: 'Berhasil' })
  async tandaTanganiBa(@Req() req: Request & { user: JwtAccessPayload }, @Param('pengajuanId', ParseUUIDPipe) pengajuanId: string, @Body() dto: TandaTanganiDto): Promise<ApiSuccessResponse<TteRiwayatResponse>> {
    const data = await this.tteService.tandaTanganiBa(req.user, pengajuanId, dto, req);
    return { message: 'Berita Acara berhasil ditandatangani', success: true, data };
  }

  @Post('tanda-tangani/pengajuan/:pengajuanId/sop-semua')
  @Roles(PeranPengguna.KEPALA_OPD)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tanda tangani seluruh SOP dalam satu pengajuan (legacy Kepala OPD)' })
  async tandaTanganiSemuaSopPengajuan(@Req() req: Request & { user: JwtAccessPayload }, @Param('pengajuanId', ParseUUIDPipe) pengajuanId: string, @Body() dto: TandaTanganiSemuaSopDto): Promise<ApiSuccessResponse<TteBatchSignSopPengajuanResponse>> {
    const data = await this.tteService.tandaTanganiSemuaSopPengajuan(req.user, pengajuanId, dto, req);
    return { message: 'Seluruh SOP dalam pengajuan berhasil ditandatangani', success: true, data };
  }

  @Post('pdf/sign')
  @Roles(PeranPengguna.PJ_EVALUATOR, PeranPengguna.PJ_PENYUSUN, PeranPengguna.KEPALA_OPD)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Sisipkan tanda tangan digital PKCS#7 ke PDF' })
  async signPdf(@Req() req: Request & { user: JwtAccessPayload }, @Body() dto: SignPdfDto): Promise<ApiSuccessResponse<SignPdfResponse>> {
    const data = await this.tteService.signPdf(req.user, dto);
    return { message: data.signatureFormat === 'UNSIGNED_NOT_REQUIRED' ? 'PDF tidak memerlukan injeksi CA' : data.signed ? 'PDF berhasil ditandatangani' : 'Penandatanganan PDF server dinonaktifkan', success: true, data };
  }
}
