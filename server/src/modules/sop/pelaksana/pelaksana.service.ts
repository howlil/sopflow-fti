import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import type { CreatePelaksanaDto } from './dto/create-pelaksana.dto';
import type { PelaksanaResponseDto } from './dto/pelaksana-response.dto';
import type { UpdatePelaksanaDto } from './dto/update-pelaksana.dto';
import { PelaksanaRepository, type PelaksanaRow } from './pelaksana.repository';

@Injectable()
export class PelaksanaService {
  constructor(private readonly pelaksanaRepository: PelaksanaRepository) {}

  async list(): Promise<PelaksanaResponseDto[]> {
    return this.mapRows(await this.pelaksanaRepository.findAll());
  }

  async create(user: JwtAccessPayload, dto: CreatePelaksanaDto): Promise<PelaksanaResponseDto> {
    const nama = dto.namaPelaksana.trim();
    await this.assertNamaAvailable(nama);

    // The old non-null OPD column is only a storage compatibility shadow. It must not
    // depend on the creator's identity and is never exposed as Pelaksana ownership.
    const storageShadow = await this.pelaksanaRepository.findLegacyStorageShadow();
    if (storageShadow === null) {
      throw new ConflictException('Storage compatibility Pelaksana belum tersedia');
    }

    try {
      const row = await this.pelaksanaRepository.createGlobal(storageShadow, nama, user.sub);
      return (await this.mapRows([row]))[0];
    } catch (error) {
      this.rethrowUniqueNameConflict(error);
      throw error;
    }
  }

  async update(
    user: JwtAccessPayload,
    id: string,
    dto: UpdatePelaksanaDto,
  ): Promise<PelaksanaResponseDto> {
    const existing = await this.pelaksanaRepository.findById(id);
    if (existing === null) {
      throw new NotFoundException('Pelaksana tidak ditemukan');
    }

    const nama = dto.namaPelaksana.trim();
    const duplicate = await this.pelaksanaRepository.findByNama(nama);
    if (duplicate !== null && duplicate.pelaksanaId !== id) {
      throw new ConflictException('Pelaksana dengan nama tersebut sudah ada di katalog global');
    }

    try {
      const row = await this.pelaksanaRepository.updateNamaGlobal(id, nama, user.sub);
      return (await this.mapRows([row]))[0];
    } catch (error) {
      this.rethrowUniqueNameConflict(error);
      throw error;
    }
  }

  async remove(_user: JwtAccessPayload, id: string): Promise<void> {
    const existing = await this.pelaksanaRepository.findById(id);
    if (existing === null) {
      throw new NotFoundException('Pelaksana tidak ditemukan');
    }
    const langkah = await this.pelaksanaRepository.countLangkahReferences(id);
    const swim = await this.pelaksanaRepository.countSwimlaneReferences(id);
    if (langkah > 0 || swim > 0) {
      throw new ConflictException(
        'Pelaksana masih direferensikan pada langkah atau jalur pelaksana SOP',
      );
    }
    await this.pelaksanaRepository.delete(id);
  }

  private async assertNamaAvailable(nama: string): Promise<void> {
    if ((await this.pelaksanaRepository.findByNama(nama)) !== null) {
      throw new ConflictException('Pelaksana dengan nama tersebut sudah ada di katalog global');
    }
  }

  private async mapRows(rows: PelaksanaRow[]): Promise<PelaksanaResponseDto[]> {
    const attributions = await this.pelaksanaRepository.findAttributionByPelaksanaIds(
      rows.map((row) => row.pelaksanaId),
    );
    const attributionById = new Map(attributions.map((item) => [item.pelaksanaId, item]));
    const userIds = attributions.flatMap((item) =>
      [item.createdById, item.updatedById].filter((id): id is string => id !== null),
    );
    const userNames = await this.pelaksanaRepository.findPenggunaNames(userIds);

    return rows.map((row) => {
      const attribution = attributionById.get(row.pelaksanaId);
      const createdById = attribution?.createdById ?? null;
      const updatedById = attribution?.updatedById ?? null;
      return {
        id: row.pelaksanaId,
        namaPelaksana: row.nama,
        createdBy:
          createdById === null
            ? null
            : { id: createdById, nama: userNames.get(createdById) ?? 'Pengguna tidak tersedia' },
        updatedBy:
          updatedById === null
            ? null
            : { id: updatedById, nama: userNames.get(updatedById) ?? 'Pengguna tidak tersedia' },
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  private rethrowUniqueNameConflict(error: unknown): void {
    if (isPrismaUniqueConstraintError(error)) {
      throw new ConflictException('Pelaksana dengan nama tersebut sudah ada di katalog global');
    }
  }
}
