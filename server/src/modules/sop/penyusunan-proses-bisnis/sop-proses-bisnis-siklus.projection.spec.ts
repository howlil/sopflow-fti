import { LingkupOrganisasi, StatusSOP } from '../../../generated/prisma';
import {
  projectProsesBisnisSopLifecycle,
  type ProsesBisnisSopLifecycleProjectionInput,
} from './sop-proses-bisnis-siklus.projection';

const baseInput: ProsesBisnisSopLifecycleProjectionInput = {
  status: StatusSOP.DRAFT,
  approvalExists: false,
  currentUserId: 'anggota-1',
  detailSopId: 'detail-1',
  prosesBisnis: {
    lingkup: LingkupOrganisasi.FACULTY,
    penanggungJawabId: 'owner-1',
    namaPenanggungJawab: 'Penanggung Jawab Proses Bisnis FTI',
    namaDepartemen: null,
  },
  authority: { holderId: 'dean-1', holderName: 'Dekan FTI' },
};

describe('projectProsesBisnisSopLifecycle', () => {
  it('projects authoring as an actionable current-user stage', () => {
    expect(projectProsesBisnisSopLifecycle(baseInput)).toEqual({
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

  it('projects Penanggung Jawab Proses Bisnis review as waiting on the contextual owner', () => {
    expect(
      projectProsesBisnisSopLifecycle({
        ...baseInput,
        status: StatusSOP.PROCESS_REVIEW,
      }),
    ).toMatchObject({
      stage: 'PROCESS_REVIEW',
      stateLabel: 'Menunggu review Penanggung Jawab Proses Bisnis',
      responsibility: { type: 'PROCESS_OWNER', name: 'Penanggung Jawab Proses Bisnis FTI' },
      action: null,
      blockingReason: 'Menunggu review Penanggung Jawab Proses Bisnis FTI.',
    });
  });

  it('projects the owner review action for the current Penanggung Jawab Proses Bisnis', () => {
    expect(
      projectProsesBisnisSopLifecycle({
        ...baseInput,
        currentUserId: 'owner-1',
        status: StatusSOP.PROCESS_REVIEW,
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
    const finalApproval = projectProsesBisnisSopLifecycle({
      ...baseInput,
      status: StatusSOP.FINAL_APPROVAL,
    });
    const tte = projectProsesBisnisSopLifecycle({
      ...baseInput,
      status: StatusSOP.TTE_PENDING,
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
    expect(projectProsesBisnisSopLifecycle({ ...baseInput, status: StatusSOP.EFFECTIVE })).toMatchObject({
      stage: 'EFFECTIVE',
      stateLabel: 'Berlaku',
      responsibility: { type: 'NONE', name: null },
      action: { type: 'OPEN', label: 'Buka SOP' },
    });
    expect(projectProsesBisnisSopLifecycle({ ...baseInput, status: StatusSOP.REVOKED })).toMatchObject({
      stage: 'REVOKED',
      stateLabel: 'Dicabut',
      responsibility: { type: 'NONE', name: null },
      action: { type: 'OPEN', label: 'Buka riwayat' },
    });
  });

  it('projects a department Proses Bisnis to its contextual Head of Departemen', () => {
    expect(
      projectProsesBisnisSopLifecycle({
        ...baseInput,
        prosesBisnis: {
          ...baseInput.prosesBisnis,
          lingkup: LingkupOrganisasi.DEPARTMENT,
          namaDepartemen: 'Teknik Informatika',
        },
        status: StatusSOP.FINAL_APPROVAL,
        authority: { holderId: 'head-1', holderName: 'Kepala TI' },
      }),
    ).toMatchObject({
      stage: 'FINAL_APPROVAL',
      responsibility: { type: 'HEAD_OF_DEPARTMENT', name: 'Kepala TI' },
      blockingReason: 'Menunggu persetujuan akhir Kepala TI.',
    });
  });
});
