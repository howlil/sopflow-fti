import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ProsesBisnisTteVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovalForSignedDetail(detailSopId: string, signerId: string, prosesBisnisId: string) {
    return this.prisma.persetujuanAkhirSOP.findFirst({
      where: {
        detailSopId,
        prosesBisnisId,
        approvedById: signerId,
      },
      select: {
        authority: true,
        authorityKey: true,
        approvedById: true,
      },
    });
  }
}
