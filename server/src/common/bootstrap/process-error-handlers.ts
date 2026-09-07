type ErrorLogger = Readonly<{
  error: (message: string, error: unknown) => void;
}>;

type ProsesBisnisTerminator = (code: number) => void;

/** Membuat handler fatal yang selalu log lalu menghentikan proses dengan exit code non-zero. */
export function createFatalProsesBisnisErrorHandler(
  logger: ErrorLogger,
  terminate: ProsesBisnisTerminator,
  label: string,
): (error: unknown) => void {
  return (error: unknown): void => {
    logger.error(label, error);
    terminate(1);
  };
}

/** Memasang handler process-level untuk kegagalan yang tidak aman untuk dilanjutkan. */
export function installFatalProsesBisnisErrorHandlers(
  logger: ErrorLogger,
  terminate: ProsesBisnisTerminator = (code) => process.exit(code),
): void {
  process.on(
    'uncaughtException',
    createFatalProsesBisnisErrorHandler(logger, terminate, 'Uncaught Exception:'),
  );
  process.on(
    'unhandledRejection',
    createFatalProsesBisnisErrorHandler(logger, terminate, 'Unhandled Rejection:'),
  );
}
