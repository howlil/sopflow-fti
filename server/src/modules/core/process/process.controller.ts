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
  CreateDepartmentDto,
  CreateProcessDto,
  UpdateDepartmentDto,
  UpdateProcessDto,
} from './dto/process-admin.dto';
import { ProcessService } from './process.service';

@ApiTags('Process Admin')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-admin')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Get('departments')
  @ApiOperation({ summary: 'Daftar departemen untuk konteks Process' })
  async listDepartments(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar departemen berhasil diambil',
      success: true,
      data: await this.processService.listDepartments(),
    };
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah departemen' })
  async createDepartment(@Body() dto: CreateDepartmentDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil ditambahkan',
      success: true,
      data: await this.processService.createDepartment(dto),
    };
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Perbarui departemen' })
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Departemen berhasil diperbarui',
      success: true,
      data: await this.processService.updateDepartment(id, dto),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Daftar pengguna aktif yang dapat ditugaskan ke Process Team' })
  async listUsers(@Query('search') search?: string): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar pengguna berhasil diambil',
      success: true,
      data: await this.processService.listAssignableUsers(search),
    };
  }

  @Get('processes')
  @ApiOperation({ summary: 'Daftar Process beserta owner dan members' })
  async listProcesses(): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Daftar Process berhasil diambil',
      success: true,
      data: await this.processService.listProcesses(),
    };
  }

  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat Process dan Process Team' })
  async createProcess(@Body() dto: CreateProcessDto): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Process berhasil dibuat',
      success: true,
      data: await this.processService.createProcess(dto),
    };
  }

  @Patch('processes/:id')
  @ApiOperation({ summary: 'Perbarui Process dan Process Team' })
  async updateProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcessDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    return {
      message: 'Process berhasil diperbarui',
      success: true,
      data: await this.processService.updateProcess(id, dto),
    };
  }
}
