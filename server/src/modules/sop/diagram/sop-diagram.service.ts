import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import type { JwtAccessPayload } from '../../../common';
import { StatusSOP } from '../../../generated/prisma';
import { ProcessContextService } from '../../core/process/process-context.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import type { UpdateSopDiagramDto } from './dto/diagram-path-overrides.dto';
import { hasInvalidDiagramEdgeKeys, isValidDiagramPathOverrides } from './diagram-edge-key.util';
import { SopDiagramRepository } from './sop-diagram.repository';

@Injectable()
export class SopDiagramService {
  constructor(
    private readonly sopDiagramRepository: SopDiagramRepository,
    private readonly sopWorkbenchReader: SopWorkbenchReader,
    private readonly processContextService: ProcessContextService,
  ) {}

  async updateDiagram(
    user: JwtAccessPayload,
    detailOrSopId: string,
    dto: UpdateSopDiagramDto,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const resolved = await this.sopDiagramRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (resolved.processId === null) {
      throw new ConflictException(
        'SOP belum memiliki Process ownership dan tidak tersedia pada endpoint native',
      );
    }
    await this.processContextService.assertCanAuthor(user.sub, resolved.processId);
    const detailStatus = await this.sopDiagramRepository.findDetailStatus(resolved.detailSopId);
    if (detailStatus === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    assertDetailSopEditable(detailStatus as StatusSOP);
    if (dto.pathOverrides !== undefined && !isValidDiagramPathOverrides(dto.pathOverrides)) {
      throw new BadRequestException('Struktur pathOverrides tidak valid');
    }
    if (hasInvalidDiagramEdgeKeys(dto.pathOverrides)) {
      throw new BadRequestException('Kunci edge pathOverrides tidak valid');
    }
    const hasChange = dto.layoutSeed !== undefined || dto.pathOverrides !== undefined;
    if (!hasChange) {
      return this.getAuthorizedWorkbench(resolved.detailSopId, logsLimit);
    }
    await this.sopDiagramRepository.upsertConfig({
      detailSopId: resolved.detailSopId,
      jenis: dto.jenis,
      layoutSeed: dto.layoutSeed,
      pathOverrides: dto.pathOverrides,
    });
    return this.getAuthorizedWorkbench(resolved.detailSopId, logsLimit);
  }

  private async getAuthorizedWorkbench(
    detailSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    return this.sopWorkbenchReader.getForDetail(detailSopId, logsLimit);
  }
}
