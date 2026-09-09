import { LingkupOrganisasi, StatusSOP } from '../../../generated/prisma';

export type ProsesBisnisSopLifecycleStage =
  | 'AUTHORING'
  | 'PROCESS_REVIEW'
  | 'FINAL_APPROVAL'
  | 'TTE'
  | 'EFFECTIVE'
  | 'REVOKED';

export type ProsesBisnisSopLifecycleResponsibilityType =
  | 'CURRENT_USER'
  | 'DRAFTER'
  | 'PROCESS_OWNER'
  | 'DEAN'
  | 'HEAD_OF_DEPARTMENT'
  | 'NONE';

export type ProsesBisnisSopLifecycleActionType =
  | 'CONTINUE_AUTHORING'
  | 'REVIEW_PROCESS'
  | 'APPROVE_FINAL'
  | 'SIGN_TTE'
  | 'OPEN';

export type ProsesBisnisSopLifecycleDestination = 'SOP_DETAIL' | 'APPROVAL_INBOX';

export interface ProsesBisnisSopLifecycleProjection {
  stage: ProsesBisnisSopLifecycleStage;
  stateLabel: string;
  responsibility: {
    type: ProsesBisnisSopLifecycleResponsibilityType;
    name: string | null;
  };
  action: {
    type: ProsesBisnisSopLifecycleActionType;
    label: string;
    destination: ProsesBisnisSopLifecycleDestination;
  } | null;
  blockingReason: string | null;
}

export interface ProsesBisnisSopLifecycleProjectionInput {
  status: string;
  approvalExists: boolean;
  currentUserId: string;
  detailSopId: string;
  prosesBisnis: {
    lingkup: LingkupOrganisasi;
    penanggungJawabId: string;
    namaPenanggungJawab: string | null;
    namaDepartemen: string | null;
  };
  authority: {
    holderId: string | null;
    holderName: string | null;
  } | null;
}

function currentUserOr(
  currentUserId: string,
  responsibleId: string | null,
  type: ProsesBisnisSopLifecycleResponsibilityType,
  name: string | null,
): ProsesBisnisSopLifecycleProjection['responsibility'] {
  return responsibleId === currentUserId ? { type: 'CURRENT_USER', name: 'Anda' } : { type, name };
}

function authorityLabel(lingkup: LingkupOrganisasi, namaDepartemen: string | null): string {
  return lingkup === LingkupOrganisasi.FACULTY
    ? 'Dekan'
    : `Kepala Departemen${namaDepartemen ? ` ${namaDepartemen}` : ''}`;
}

function siklusAction(
  type: ProsesBisnisSopLifecycleActionType,
  label: string,
  destination: ProsesBisnisSopLifecycleDestination,
): NonNullable<ProsesBisnisSopLifecycleProjection['action']> {
  return { type, label, destination };
}

export function projectProsesBisnisSopLifecycle(
  input: ProsesBisnisSopLifecycleProjectionInput,
): ProsesBisnisSopLifecycleProjection {
  const { prosesBisnis, authority } = input;
  const currentUserIsProcessOwner = input.currentUserId === prosesBisnis.penanggungJawabId;
  const authorityType: ProsesBisnisSopLifecycleResponsibilityType =
    prosesBisnis.lingkup === LingkupOrganisasi.FACULTY ? 'DEAN' : 'HEAD_OF_DEPARTMENT';
  const resolvedAuthorityLabel = authorityLabel(prosesBisnis.lingkup, prosesBisnis.namaDepartemen);

  if (input.status === StatusSOP.DRAFT || input.status === StatusSOP.REVISION_REQUIRED) {
    const isRevision = input.status === StatusSOP.REVISION_REQUIRED;
    if (currentUserIsProcessOwner) {
      return {
        stage: 'AUTHORING',
        stateLabel: isRevision ? 'Perlu revisi oleh Penyusun' : 'Dalam penyusunan',
        responsibility: { type: 'DRAFTER', name: 'Penyusun SOP' },
        action: null,
        blockingReason: isRevision
          ? 'Menunggu Penyusun SOP menyelesaikan revisi.'
          : 'Menunggu Penyusun SOP menyelesaikan dokumen.',
      };
    }
    return {
      stage: 'AUTHORING',
      stateLabel: isRevision ? 'Perlu revisi' : 'Draft',
      responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      action: siklusAction(
        'CONTINUE_AUTHORING',
        isRevision ? 'Perbaiki SOP' : 'Lanjutkan SOP',
        'SOP_DETAIL',
      ),
      blockingReason: null,
    };
  }

  if (input.status === StatusSOP.PROCESS_REVIEW) {
    const responsibility = currentUserOr(
      input.currentUserId,
      prosesBisnis.penanggungJawabId,
      'PROCESS_OWNER',
      prosesBisnis.namaPenanggungJawab,
    );
    const isCurrentUser = responsibility.type === 'CURRENT_USER';
    return {
      stage: 'PROCESS_REVIEW',
      stateLabel: 'Menunggu pemeriksaan Penanggung Jawab Proses Bisnis',
      responsibility,
      action: isCurrentUser ? siklusAction('REVIEW_PROCESS', 'Periksa SOP', 'SOP_DETAIL') : null,
      blockingReason: isCurrentUser
        ? null
        : `Menunggu pemeriksaan ${prosesBisnis.namaPenanggungJawab ?? 'Penanggung Jawab Proses Bisnis'}.`,
    };
  }

  if (input.status === StatusSOP.FINAL_APPROVAL || input.status === StatusSOP.TTE_PENDING) {
    const hasAuthorityHolder = authority?.holderId !== null && authority?.holderId !== undefined;
    const responsibility = currentUserOr(
      input.currentUserId,
      authority?.holderId ?? null,
      authorityType,
      authority?.holderName ?? resolvedAuthorityLabel,
    );
    const isCurrentUser = responsibility.type === 'CURRENT_USER';

    if (input.status === StatusSOP.FINAL_APPROVAL) {
      return {
        stage: 'FINAL_APPROVAL',
        stateLabel: 'Menunggu pengesahan',
        responsibility,
        action: isCurrentUser
          ? siklusAction('APPROVE_FINAL', 'Sahkan SOP', 'APPROVAL_INBOX')
          : null,
        blockingReason: isCurrentUser
          ? null
          : hasAuthorityHolder
            ? `Menunggu pengesahan ${authority?.holderName ?? resolvedAuthorityLabel}.`
            : `Menunggu penetapan ${resolvedAuthorityLabel}.`,
      };
    }

    return {
      stage: 'TTE',
      stateLabel: 'Menunggu TTE',
      responsibility,
      action: isCurrentUser ? siklusAction('SIGN_TTE', 'Tanda Tangani', 'APPROVAL_INBOX') : null,
      blockingReason: isCurrentUser
        ? null
        : hasAuthorityHolder
          ? `Menunggu TTE ${authority?.holderName ?? resolvedAuthorityLabel}.`
          : `Menunggu penetapan ${resolvedAuthorityLabel}.`,
    };
  }

  if (input.status === StatusSOP.EFFECTIVE) {
    return {
      stage: 'EFFECTIVE',
      stateLabel: 'Berlaku',
      responsibility: { type: 'NONE', name: null },
      action: siklusAction('OPEN', 'Buka SOP', 'SOP_DETAIL'),
      blockingReason: null,
    };
  }

  if (input.status === StatusSOP.REVOKED) {
    return {
      stage: 'REVOKED',
      stateLabel: 'Dicabut',
      responsibility: { type: 'NONE', name: null },
      action: siklusAction('OPEN', 'Buka riwayat', 'SOP_DETAIL'),
      blockingReason: null,
    };
  }

  return {
    stage: 'EFFECTIVE',
    stateLabel: input.status === StatusSOP.SUPERSEDED ? 'Digantikan' : 'Perlu ditinjau',
    responsibility: { type: 'NONE', name: null },
    action: siklusAction('OPEN', 'Buka SOP', 'SOP_DETAIL'),
    blockingReason: null,
  };
}
