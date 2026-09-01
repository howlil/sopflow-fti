import { createFatalProcessErrorHandler } from './process-error-handlers';

describe('createFatalProcessErrorHandler', () => {
  it('mencatat error lalu menghentikan proses dengan exit code 1', () => {
    const logger = { error: jest.fn() };
    const terminate = jest.fn();
    const handler = createFatalProcessErrorHandler(logger, terminate, 'Uncaught Exception:');
    const error = new Error('boom');

    handler(error);

    expect(logger.error).toHaveBeenCalledWith('Uncaught Exception:', error);
    expect(terminate).toHaveBeenCalledWith(1);
  });
});
