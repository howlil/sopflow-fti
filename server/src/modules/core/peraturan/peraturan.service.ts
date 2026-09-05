import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import type { CreatePeraturanDto } from './dto/create-peraturan.dto';
import type { PeraturanResponseDto } from './dto/peraturan-response.dto';
import type { UpdatePeraturanDto } from './dto/update-peraturan.dto';
import { PeraturanRepository, type PeraturanRow } from './peraturan.repository';

@Injectable()
export class PeraturanService {
  constructor(private readonly peraturanRepository: PeraturanRepository) {}

  private mapRow(row: PeraturanRow): PeraturanResponseDto {
    return {
      id: row.peraturanId,
      namaPeraturan: row.nama,
      nomor: row.nomor,
      tahun: row.tahun,
      tentang: row.tentang,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastEditedById: row.lastEditedById,
      lastEditedBy:
        row.lastEditedBy === null
          ? null
          : { id: row.lastEditedBy.penggunaId, nama: row.lastEditedBy.nama },
      digunakan: row.dasarHukumCount,
    };
  }

  async list(): Promise<PeraturanResponseDto[]> {
    return (await this.peraturanRepository.findMany()).map((row) => this.mapRow(row));
  }

  async getById(id: string): Promise<PeraturanResponseDto> {
    const row = await this.peraturanRepository.findById(id);
    if (row === null) throw new NotFoundException('Peraturan tidak ditemukan');
    return this.mapRow(row);
  }

  async create(user: JwtAccessPayload, dto: CreatePeraturanDto): Promise<PeraturanResponseDto> {
    try {
      return this.mapRow(
        await this.peraturanRepository.create({
          nama: dto.namaPeraturan,
          nomor: dto.nomor,
          tahun: dto.tahun,
          tentang: dto.tentang,
          lastEditedById: user.sub,
        }),
      );
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Nomor dan tahun peraturan sudah terdaftar');
      }
      throw error;
    }
  }

  async update(
    user: JwtAccessPayload,
    id: string,
    dto: UpdatePeraturanDto,
  ): Promise<PeraturanResponseDto> {
    if ((await this.peraturanRepository.findById(id)) === null) {
      throw new NotFoundException('Peraturan tidak ditemukan');
    }
    const patch: { nama?: string; nomor?: string; tahun?: number; tentang?: string } = {};
    if (dto.namaPeraturan !== undefined) patch.nama = dto.namaPeraturan;
    if (dto.nomor !== undefined) patch.nomor = dto.nomor;
    if (dto.tahun !== undefined) patch.tahun = dto.tahun;
    if (dto.tentang !== undefined) patch.tentang = dto.tentang;
    if (Object.keys(patch).length === 0) return this.getById(id);

    try {
      return this.mapRow(await this.peraturanRepository.update(id, patch, user.sub));
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Nomor dan tahun peraturan sudah terdaftar');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    if ((await this.peraturanRepository.findById(id)) === null) {
      throw new NotFoundException('Peraturan tidak ditemukan');
    }
    const used = await this.peraturanRepository.countDasarHukum(id);
    if (used > 0) {
      throw new ConflictException(`Peraturan masih digunakan sebagai dasar hukum pada ${used} SOP`);
    }
    await this.peraturanRepository.delete(id);
  }
}
