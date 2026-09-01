import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ProcessTteVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovalForSignedDetail(detailSopId: string, signerId: string) {
    return this.prisma.processFinalApproval.findFirst({
      where: {
        detailSopId,
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
