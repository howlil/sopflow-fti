import { OrganizationalScope, StatusSOP } from '../../../generated/prisma';
import {
  projectProcessSopLifecycle,
  type ProcessSopLifecycleProjectionInput,
} from './process-sop-lifecycle.projection';

const baseInput: ProcessSopLifecycleProjectionInput = {
  status: StatusSOP.DRAFT,
  approvalExists: false,
  currentUserId: 'member-1',
  detailSopId: 'detail-1',
  process: {
    scope: OrganizationalScope.FACULTY,
    ownerId: 'owner-1',
    ownerName: 'Process Owner FTI',
    departmentName: null,
  },
  authority: { holderId: 'dean-1', holderName: 'Dekan FTI' },
};

describe('projectProcessSopLifecycle', () => {
  it('projects authoring as an actionable current-user stage', () => {
    expect(projectProcessSopLifecycle(baseInput)).toEqual({
      stage: 'AUTHORING',
      stateLabel: 'Draft',
      responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      action: {
        type: 'CONTINUE_AUTHORING',
        label: 'Lanjutkan SOP',
        destination: 'SOP_DETAIL',
      },
      blockingReason: null,
    });
  });

  it('projects Process Owner review as waiting on the contextual owner', () => {
    expect(
      projectProcessSopLifecycle({
        ...baseInput,
        status: StatusSOP.SEDANG_DIEVALUASI,
      }),
    ).toMatchObject({
      stage: 'PROCESS_REVIEW',
      stateLabel: 'Menunggu review Process Owner',
      responsibility: { type: 'PROCESS_OWNER', name: 'Process Owner FTI' },
      action: null,
      blockingReason: 'Menunggu review Process Owner FTI.',
    });
  });

  it('projects the owner review action for the current Process Owner', () => {
    expect(
      projectProcessSopLifecycle({
        ...baseInput,
        currentUserId: 'owner-1',
        status: StatusSOP.SEDANG_DIEVALUASI,
      }),
    ).toMatchObject({
      responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      action: {
        type: 'REVIEW_PROCESS',
        label: 'Review SOP',
        destination: 'SOP_DETAIL',
      },
      blockingReason: null,
    });
  });

  it('distinguishes final approval from TTE for the same authority', () => {
    const finalApproval = projectProcessSopLifecycle({
      ...baseInput,
      status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
    });
    const tte = projectProcessSopLifecycle({
      ...baseInput,
      status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
      approvalExists: true,
      currentUserId: 'dean-1',
    });

    expect(finalApproval).toMatchObject({
      stage: 'FINAL_APPROVAL',
      stateLabel: 'Menunggu persetujuan akhir',
      responsibility: { type: 'DEAN', name: 'Dekan FTI' },
      action: null,
    });
    expect(tte).toMatchObject({
      stage: 'TTE',
      stateLabel: 'Menunggu TTE',
      responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      action: {
        type: 'SIGN_TTE',
        label: 'Tanda tangani',
        destination: 'APPROVAL_INBOX',
      },
    });
  });

  it('keeps effective and revoked states out of actionable responsibility', () => {
    expect(projectProcessSopLifecycle({ ...baseInput, status: StatusSOP.BERLAKU })).toMatchObject({
      stage: 'EFFECTIVE',
      stateLabel: 'Berlaku',
      responsibility: { type: 'NONE', name: null },
      action: { type: 'OPEN', label: 'Buka SOP' },
    });
    expect(projectProcessSopLifecycle({ ...baseInput, status: StatusSOP.DICABUT })).toMatchObject({
      stage: 'REVOKED',
      stateLabel: 'Dicabut',
      responsibility: { type: 'NONE', name: null },
      action: { type: 'OPEN', label: 'Buka riwayat' },
    });
  });

  it('projects a department Process to its contextual Head of Department', () => {
    expect(
      projectProcessSopLifecycle({
        ...baseInput,
        process: {
          ...baseInput.process,
          scope: OrganizationalScope.DEPARTMENT,
          departmentName: 'Teknik Informatika',
        },
        status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
        authority: { holderId: 'head-1', holderName: 'Kepala TI' },
      }),
    ).toMatchObject({
      stage: 'FINAL_APPROVAL',
      responsibility: { type: 'HEAD_OF_DEPARTMENT', name: 'Kepala TI' },
      blockingReason: 'Menunggu persetujuan akhir Kepala TI.',
    });
  });
});
