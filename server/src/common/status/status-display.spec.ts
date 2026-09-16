import { StatusSOP } from '../../generated/prisma';
import { displayStatusSop } from './status-display';

describe('status display', () => {
  it('provides a label for every SOP status', () => {
    for (const status of Object.values(StatusSOP)) {
      const actual = displayStatusSop(status);
      expect(actual.value).toBe(status);
      expect(actual.label.length).toBeGreaterThan(0);
    }
  });

  it('uses a safe fallback for an unknown status', () => {
    const actual = displayStatusSop('STATUS_GAIB');
    expect(actual.label).toBe('Status tidak dikenal');
    expect(actual.value).toBe('STATUS_GAIB');
  });
});
