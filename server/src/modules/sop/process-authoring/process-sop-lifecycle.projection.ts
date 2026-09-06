import { OrganizationalScope, StatusSOP } from '../../../generated/prisma';

export type ProcessSopLifecycleStage =
  | 'AUTHORING'
  | 'PROCESS_REVIEW'
  | 'FINAL_APPROVAL'
  | 'TTE'
  | 'EFFECTIVE'
  | 'REVOKED';

export type ProcessSopLifecycleResponsibilityType =
  | 'CURRENT_USER'
  | 'PROCESS_OWNER'
  | 'DEAN'
  | 'HEAD_OF_DEPARTMENT'
  | 'NONE';

export type ProcessSopLifecycleActionType =
  | 'CONTINUE_AUTHORING'
  | 'REVIEW_PROCESS'
  | 'APPROVE_FINAL'
  | 'SIGN_TTE'
  | 'OPEN';

export type ProcessSopLifecycleDestination = 'SOP_DETAIL' | 'APPROVAL_INBOX';

export interface ProcessSopLifecycleProjection {
  stage: ProcessSopLifecycleStage;
  stateLabel: string;
  responsibility: {
    type: ProcessSopLifecycleResponsibilityType;
    name: string | null;
  };
  action: {
    type: ProcessSopLifecycleActionType;
    label: string;
    destination: ProcessSopLifecycleDestination;
  } | null;
  blockingReason: string | null;
}

export interface ProcessSopLifecycleProjectionInput {
  status: string;
  approvalExists: boolean;
  currentUserId: string;
  detailSopId: string;
  process: {
    scope: OrganizationalScope;
    ownerId: string;
    ownerName: string | null;
    departmentName: string | null;
  };
  authority: {
    holderId: string | null;
    holderName: string | null;
  } | null;
}

function currentUserOr(
  currentUserId: string,
  responsibleId: string | null,
  type: ProcessSopLifecycleResponsibilityType,
  name: string | null,
): ProcessSopLifecycleProjection['responsibility'] {
  return responsibleId === currentUserId ? { type: 'CURRENT_USER', name: 'Anda' } : { type, name };
}

function authorityLabel(scope: OrganizationalScope, departmentName: string | null): string {
  return scope === OrganizationalScope.FACULTY
    ? 'Dekan'
    : `Kepala Departemen${departmentName ? ` ${departmentName}` : ''}`;
}

function lifecycleAction(
  type: ProcessSopLifecycleActionType,
  label: string,
  destination: ProcessSopLifecycleDestination,
): NonNullable<ProcessSopLifecycleProjection['action']> {
  return { type, label, destination };
}

export function projectProcessSopLifecycle(
  input: ProcessSopLifecycleProjectionInput,
): ProcessSopLifecycleProjection {
  const { process, authority } = input;
  const authorityType: ProcessSopLifecycleResponsibilityType =
    process.scope === OrganizationalScope.FACULTY ? 'DEAN' : 'HEAD_OF_DEPARTMENT';
  const resolvedAuthorityLabel = authorityLabel(process.scope, process.departmentName);

  if (input.status === StatusSOP.DRAFT || input.status === StatusSOP.REVISION_REQUIRED) {
    const isRevision = input.status === StatusSOP.REVISION_REQUIRED;
    return {
      stage: 'AUTHORING',
      stateLabel: isRevision ? 'Perlu revisi' : 'Draft',
      responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      action: lifecycleAction(
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
      process.ownerId,
      'PROCESS_OWNER',
      process.ownerName,
    );
    const isCurrentUser = responsibility.type === 'CURRENT_USER';
    return {
      stage: 'PROCESS_REVIEW',
      stateLabel: 'Menunggu review Process Owner',
      responsibility,
      action: isCurrentUser ? lifecycleAction('REVIEW_PROCESS', 'Review SOP', 'SOP_DETAIL') : null,
      blockingReason: isCurrentUser
        ? null
        : `Menunggu review ${process.ownerName ?? 'Process Owner'}.`,
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
        stateLabel: 'Menunggu persetujuan akhir',
        responsibility,
        action: isCurrentUser
          ? lifecycleAction('APPROVE_FINAL', 'Setujui SOP', 'APPROVAL_INBOX')
          : null,
        blockingReason: isCurrentUser
          ? null
          : hasAuthorityHolder
            ? `Menunggu persetujuan akhir ${authority?.holderName ?? resolvedAuthorityLabel}.`
            : `Menunggu konfigurasi ${resolvedAuthorityLabel}.`,
      };
    }

    return {
      stage: 'TTE',
      stateLabel: 'Menunggu TTE',
      responsibility,
      action: isCurrentUser ? lifecycleAction('SIGN_TTE', 'Tanda tangani', 'APPROVAL_INBOX') : null,
      blockingReason: isCurrentUser
        ? null
        : hasAuthorityHolder
          ? `Menunggu TTE ${authority?.holderName ?? resolvedAuthorityLabel}.`
          : `Menunggu konfigurasi ${resolvedAuthorityLabel}.`,
    };
  }

  if (input.status === StatusSOP.EFFECTIVE) {
    return {
      stage: 'EFFECTIVE',
      stateLabel: 'Berlaku',
      responsibility: { type: 'NONE', name: null },
      action: lifecycleAction('OPEN', 'Buka SOP', 'SOP_DETAIL'),
      blockingReason: null,
    };
  }

  if (input.status === StatusSOP.REVOKED) {
    return {
      stage: 'REVOKED',
      stateLabel: 'Dicabut',
      responsibility: { type: 'NONE', name: null },
      action: lifecycleAction('OPEN', 'Buka riwayat', 'SOP_DETAIL'),
      blockingReason: null,
    };
  }

  return {
    stage: 'EFFECTIVE',
    stateLabel: input.status === StatusSOP.SUPERSEDED ? 'Digantikan' : 'Perlu ditinjau',
    responsibility: { type: 'NONE', name: null },
    action: lifecycleAction('OPEN', 'Buka SOP', 'SOP_DETAIL'),
    blockingReason: null,
  };
}
