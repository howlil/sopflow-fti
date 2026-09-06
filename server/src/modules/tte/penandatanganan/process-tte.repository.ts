import { Injectable } from '@nestjs/common';
import { JenisDokumenTte, Prisma, StatusSOP } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { PdfSignatureMetadataInput } from '../shared/repository/tte.repository';

export type ProcessTteSigningContext = {
  readonly detailSopId: string;
  readonly sopId: string;
  readonly judulSop: string;
  readonly nomorSOP: string;
  readonly versi: number;
  readonly processId: string;
  readonly approval: {
    readonly approvedById: string;
    readonly authority: 'DEAN' | 'HEAD_OF_DEPARTMENT';
    readonly authorityKey: string;
    readonly approvedAt: Date;
  };
};

type ProcessTteContextFailure = {
  readonly ok?: false;
  readonly error:
    | 'NOT_FOUND'
    | 'NOT_LATEST'
    | 'UNASSIGNED_ARCHIVE'
    | 'NOT_APPROVED'
    | 'APPROVAL_CONTEXT_DRIFT'
    | 'BAD_STATUS';
  readonly status?: StatusSOP;
};

export type ProcessTteContextResult =
  | { readonly ok: true; readonly context: ProcessTteSigningContext }
  | ProcessTteContextFailure;

export type ProcessTtePreparedDocument = ProcessTteSigningContext & {
  readonly dokumenTteId: string;
  readonly hashDokumen: string;
};

type ProcessTtePrepareFailure =
  | ProcessTteContextFailure
  | {
      readonly ok?: false;
      readonly error: 'FORBIDDEN_SIGNER' | 'INVALID_DOC_PARENT' | 'ALREADY_SIGNED';
    };

export type ProcessTtePrepareResult =
  | { readonly ok: true; readonly item: ProcessTtePreparedDocument }
  | ProcessTtePrepareFailure;

export type ProcessTteFinalizeResult =
  | {
      readonly ok: true;
      readonly detailSopId: string;
      readonly dokumenTteId: string;
      readonly authority: 'DEAN' | 'HEAD_OF_DEPARTMENT';
      readonly authorityKey: string;
    }
  | ProcessTtePrepareFailure
  | { readonly ok?: false; readonly error: 'SOP_STATUS_DRIFT' };

export type ProcessTteFinalizeSideEffect = (
  tx: Prisma.TransactionClient,
  context: ProcessTteSigningContext,
) => Promise<void>;

class ProcessTteStatusDriftError extends Error {}

@Injectable()
export class ProcessTteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSigningContext(detailOrSopId: string): Promise<ProcessTteContextResult> {
    return this.prisma.$transaction((tx) => this.resolveContext(tx, detailOrSopId));
  }

  async prepareDocument(params: {
    detailOrSopId: string;
    userId: string;
    hashDokumen: string;
    nomorDokumen: string;
    judulDokumen: string;
  }): Promise<ProcessTtePrepareResult> {
    return this.prisma.$transaction(async (tx) => {
      const resolved = await this.resolveContext(tx, params.detailOrSopId);
      if (!resolved.ok) return resolved;
      const context = resolved.context;
      if (context.approval.approvedById !== params.userId) {
        return { error: 'FORBIDDEN_SIGNER' as const };
      }

      let dokumen = await tx.dokumenTte.findUnique({
        where: { detailSopId: context.detailSopId },
      });
      if (dokumen === null) {
        dokumen = await tx.dokumenTte.create({
          data: {
            nomorDokumen: params.nomorDokumen,
            judulDokumen: params.judulDokumen,
            hashDokumen: params.hashDokumen,
            jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
            detailSopId: context.detailSopId,
            processId: context.processId,
          },
        });
      } else {
        if (
          dokumen.detailSopId !== context.detailSopId ||
          dokumen.processId !== context.processId ||
          dokumen.jenisDokumen !== JenisDokumenTte.SOP_BERLAKU
        ) {
          return { error: 'INVALID_DOC_PARENT' as const };
        }
        const existingSignature = await tx.riwayatTandaTangan.findFirst({
          where: { dokumenTteId: dokumen.dokumenTteId },
          select: { userId: true },
        });
        if (existingSignature !== null) {
          return { error: 'ALREADY_SIGNED' as const };
        }
        dokumen = await tx.dokumenTte.update({
          where: { dokumenTteId: dokumen.dokumenTteId },
          data: {
            nomorDokumen: params.nomorDokumen,
            judulDokumen: params.judulDokumen,
            hashDokumen: params.hashDokumen,
            processId: context.processId,
          },
        });
      }

      return {
        ok: true as const,
        item: {
          ...context,
          dokumenTteId: dokumen.dokumenTteId,
          hashDokumen: params.hashDokumen,
        },
      };
    });
  }

  async finalizeWithArtifact(
    params: {
      detailOrSopId: string;
      userId: string;
      signedAt: Date;
      tanggalEfektif: Date;
      dokumenTteId: string;
      pdfPath: string;
      pdfSha256: string;
      pdfSizeBytes: number;
      signatureMetadata: PdfSignatureMetadataInput;
    },
    onFinalizeInTransaction?: ProcessTteFinalizeSideEffect,
  ): Promise<ProcessTteFinalizeResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const resolved = await this.resolveContext(tx, params.detailOrSopId);
        if (!resolved.ok) return resolved;
        const context = resolved.context;
        if (context.approval.approvedById !== params.userId) {
          return { error: 'FORBIDDEN_SIGNER' as const };
        }

        const dokumen = await tx.dokumenTte.findUnique({
          where: { detailSopId: context.detailSopId },
        });
        if (
          dokumen === null ||
          dokumen.dokumenTteId !== params.dokumenTteId ||
          dokumen.detailSopId !== context.detailSopId ||
          dokumen.processId !== context.processId ||
          dokumen.jenisDokumen !== JenisDokumenTte.SOP_BERLAKU
        ) {
          return { error: 'INVALID_DOC_PARENT' as const };
        }
        const existingSignature = await tx.riwayatTandaTangan.findFirst({
          where: { dokumenTteId: dokumen.dokumenTteId },
          select: { userId: true },
        });
        if (existingSignature !== null) {
          return { error: 'ALREADY_SIGNED' as const };
        }

        const replaced = await tx.detailSOP.findMany({
          where: {
            sopId: context.sopId,
            detailSopId: { not: context.detailSopId },
            status: StatusSOP.EFFECTIVE,
          },
          select: { detailSopId: true },
        });
        await tx.detailSOP.updateMany({
          where: {
            sopId: context.sopId,
            detailSopId: { not: context.detailSopId },
            status: StatusSOP.EFFECTIVE,
          },
          data: { status: StatusSOP.SUPERSEDED },
        });
        await this.updatePdfStatusForDetailIds(
          tx,
          replaced.map((row) => row.detailSopId),
          params.signedAt,
        );

        const promoted = await tx.detailSOP.updateMany({
          where: {
            detailSopId: context.detailSopId,
            status: StatusSOP.TTE_PENDING,
          },
          data: {
            status: StatusSOP.EFFECTIVE,
            terakhirDieditOlehId: params.userId,
            tanggalEfektif: params.tanggalEfektif,
          },
        });
        if (promoted.count !== 1) {
          throw new ProcessTteStatusDriftError();
        }

        await tx.riwayatTandaTangan.create({
          data: {
            userId: params.userId,
            dokumenTteId: dokumen.dokumenTteId,
            authority: context.approval.authority,
            ditandatanganiPada: params.signedAt,
            signatureValue: params.signatureMetadata.signatureValue,
            signatureAlgorithm: params.signatureMetadata.signatureAlgorithm,
            signatureFormat: params.signatureMetadata.signatureFormat,
            certSerialNumber: params.signatureMetadata.certSerialNumber,
            certIssuer: params.signatureMetadata.certIssuer,
            certSubject: params.signatureMetadata.certSubject,
            certFingerprint: params.signatureMetadata.certFingerprint,
            certValidFrom: params.signatureMetadata.certValidFrom,
            certValidTo: params.signatureMetadata.certValidTo,
          },
        });
        await tx.$executeRaw`
          UPDATE DokumenTte
          SET pdfPath = ${params.pdfPath},
              pdfSha256 = ${params.pdfSha256},
              pdfSizeBytes = ${params.pdfSizeBytes},
              pdfGeneratedAt = ${params.signedAt},
              pdfPublishedAt = ${params.signedAt},
              pdfRevokedAt = NULL,
              pdfStatus = ${'PUBLISHED'}
          WHERE dokumenTteId = ${dokumen.dokumenTteId}
        `;

        if (onFinalizeInTransaction !== undefined) {
          await onFinalizeInTransaction(tx, context);
        }

        return {
          ok: true as const,
          detailSopId: context.detailSopId,
          dokumenTteId: dokumen.dokumenTteId,
          authority: context.approval.authority,
          authorityKey: context.approval.authorityKey,
        };
      });
    } catch (error) {
      if (error instanceof ProcessTteStatusDriftError) {
        return { error: 'SOP_STATUS_DRIFT' as const };
      }
      throw error;
    }
  }

  private async resolveContext(
    tx: Prisma.TransactionClient,
    detailOrSopId: string,
  ): Promise<ProcessTteContextResult> {
    const direct = await tx.detailSOP.findUnique({
      where: { detailSopId: detailOrSopId },
      select: {
        detailSopId: true,
        sopId: true,
        nomorSOP: true,
        versi: true,
        status: true,
        sop: { select: { processId: true, judul: true } },
      },
    });
    const detail =
      direct ??
      (await tx.detailSOP.findFirst({
        where: { sopId: detailOrSopId },
        orderBy: { versi: 'desc' },
        select: {
          detailSopId: true,
          sopId: true,
          nomorSOP: true,
          versi: true,
          status: true,
          sop: { select: { processId: true, judul: true } },
        },
      }));
    if (detail === null) return { error: 'NOT_FOUND' as const };

    const latest = await tx.detailSOP.findFirst({
      where: { sopId: detail.sopId },
      orderBy: { versi: 'desc' },
      select: { detailSopId: true },
    });
    if (latest === null || latest.detailSopId !== detail.detailSopId) {
      return { error: 'NOT_LATEST' as const };
    }

    const processId = detail.sop.processId;
    if (processId === null) return { error: 'UNASSIGNED_ARCHIVE' as const };

    const approval = await tx.processFinalApproval.findUnique({
      where: { detailSopId: detail.detailSopId },
      select: {
        processId: true,
        approvedById: true,
        authority: true,
        authorityKey: true,
        approvedAt: true,
      },
    });
    if (approval === null) return { error: 'NOT_APPROVED' as const };
    if (approval.processId !== processId) {
      return { error: 'APPROVAL_CONTEXT_DRIFT' as const };
    }
    if (detail.status !== StatusSOP.TTE_PENDING) {
      return { error: 'BAD_STATUS' as const, status: detail.status };
    }

    return {
      ok: true as const,
      context: {
        detailSopId: detail.detailSopId,
        sopId: detail.sopId,
        judulSop: detail.sop.judul,
        nomorSOP: detail.nomorSOP,
        versi: detail.versi,
        processId,
        approval: {
          approvedById: approval.approvedById,
          authority: approval.authority,
          authorityKey: approval.authorityKey,
          approvedAt: approval.approvedAt,
        },
      },
    };
  }

  private async updatePdfStatusForDetailIds(
    tx: Prisma.TransactionClient,
    detailSopIds: string[],
    timestamp: Date,
  ): Promise<void> {
    if (detailSopIds.length === 0) return;
    await tx.$executeRaw`
      UPDATE DokumenTte
      SET pdfStatus = ${'SUPERSEDED'},
          pdfRevokedAt = ${timestamp}
      WHERE detailSopId IN (${Prisma.join(detailSopIds)})
        AND jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
    `;
  }
}
