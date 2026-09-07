import { createFatalProsesBisnisErrorHandler } from './process-error-handlers';

describe('createFatalProsesBisnisErrorHandler', () => {
  it('mencatat error lalu menghentikan proses dengan exit code 1', () => {
    const logger = { error: jest.fn() };
    const terminate = jest.fn();
    const handler = createFatalProsesBisnisErrorHandler(logger, terminate, 'Uncaught Exception:');
    const error = new Error('boom');

    handler(error);

    expect(logger.error).toHaveBeenCalledWith('Uncaught Exception:', error);
    expect(terminate).toHaveBeenCalledWith(1);
  });
});
