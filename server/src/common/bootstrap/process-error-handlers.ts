type ErrorLogger = Readonly<{
  error: (message: string, error: unknown) => void;
}>;

type ProcessTerminator = (code: number) => void;

/** Membuat handler fatal yang selalu log lalu menghentikan proses dengan exit code non-zero. */
export function createFatalProcessErrorHandler(
  logger: ErrorLogger,
  terminate: ProcessTerminator,
  label: string,
): (error: unknown) => void {
  return (error: unknown): void => {
    logger.error(label, error);
    terminate(1);
  };
}

/** Memasang handler process-level untuk kegagalan yang tidak aman untuk dilanjutkan. */
export function installFatalProcessErrorHandlers(
  logger: ErrorLogger,
  terminate: ProcessTerminator = (code) => process.exit(code),
): void {
  process.on(
    'uncaughtException',
    createFatalProcessErrorHandler(logger, terminate, 'Uncaught Exception:'),
  );
  process.on(
    'unhandledRejection',
    createFatalProcessErrorHandler(logger, terminate, 'Unhandled Rejection:'),
  );
}
