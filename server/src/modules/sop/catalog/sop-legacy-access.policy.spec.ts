import { ForbiddenException } from '@nestjs/common';
import { PeranPengguna } from '../../../generated/prisma';
import type { UserOpdAccessService } from '../../core/opd/user-opd-access.service';
import type { JwtAccessPayload } from '../../../common';
import { SopLegacyAccessPolicy } from './sop-legacy-access.policy';

describe('SopLegacyAccessPolicy', () => {
  const user: JwtAccessPayload = {
    sub: 'user-1',
    email: 'user@example.test',
    peran: PeranPengguna.PENYUSUN,
  };

  it('delegates OPD-scoped catalog access to the legacy OPD service', async () => {
    const access = {
      isEvaluatorRole: jest.fn().mockReturnValue(false),
      getRequiredUserOpdId: jest.fn().mockResolvedValue('opd-1'),
      assertWorkbenchAccess: jest.fn().mockResolvedValue(undefined),
    };
    const policy = new SopLegacyAccessPolicy(access as unknown as UserOpdAccessService);

    expect(policy.isEvaluatorRole(PeranPengguna.PENYUSUN)).toBe(false);
    await expect(policy.getRequiredUserOpdId('user-1')).resolves.toBe('opd-1');
    await policy.assertWorkbenchAccess(user, 'opd-1');

    expect(access.getRequiredUserOpdId).toHaveBeenCalledWith('user-1');
    expect(access.assertWorkbenchAccess).toHaveBeenCalledWith(user, 'opd-1');
  });

  it('rejects native or OPD-less context before calling legacy access', async () => {
    const access = {
      assertWorkbenchAccess: jest.fn().mockResolvedValue(undefined),
    };
    const policy = new SopLegacyAccessPolicy(access as unknown as UserOpdAccessService);

    await expect(
      policy.assertLegacyContextAccess(user, { processId: 'process-1', sopOpdId: 'opd-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      policy.assertLegacyContextAccess(user, { processId: null, sopOpdId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(access.assertWorkbenchAccess).not.toHaveBeenCalled();
  });

  it('allows an OPD-compatible context through the legacy access service', async () => {
    const access = {
      assertWorkbenchAccess: jest.fn().mockResolvedValue(undefined),
    };
    const policy = new SopLegacyAccessPolicy(access as unknown as UserOpdAccessService);

    await policy.assertLegacyContextAccess(user, { processId: null, sopOpdId: 'opd-1' });

    expect(access.assertWorkbenchAccess).toHaveBeenCalledWith(user, 'opd-1');
  });
});
